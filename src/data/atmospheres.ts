export const atmospheres = {
  sunny: { backdrop:'#eee8dc', backdropGlow:'#f4eee3', tone:'light', label:'晴天', sky:['#69a6c4','#d9ded0'], building:'#779095', sun:'#ffe4ae', sunPower:4.8, sunPosition:[5.1,5.5,-8], ambient:1.35, fill:1.1, floor:0, desk:0, moon:false, clouds:.5 },
  rain: { backdrop:'#c6d0cb', backdropGlow:'#d4dbd5', tone:'light', label:'雨天', sky:['#526979','#9ba7a5'], building:'#52646b', sun:'#b9d0df', sunPower:.32, sunPosition:[4.7,6.2,-8], ambient:1.0, fill:.65, floor:58, desk:65, moon:false, clouds:.8 },
  snow: { backdrop:'#e2e7e3', backdropGlow:'#edf0ea', tone:'light', label:'落雪', sky:['#849bac','#d8dcd3'], building:'#93a1a6', sun:'#dbe8f4', sunPower:.85, sunPosition:[4.7,6.2,-8], ambient:1.2, fill:.75, floor:52, desk:60, moon:false, clouds:.55 },
  sunset: { backdrop:'#cfa994', backdropGlow:'#e4c7b1', tone:'light', label:'夕阳', sky:['#87788e','#edaa71'], building:'#826e69', sun:'#ffae62', sunPower:3.4, sunPosition:[5,3.65,-7.2], ambient:.48, fill:.18, floor:18, desk:45, moon:false, clouds:.23 },
  blue: { backdrop:'#465960', backdropGlow:'#576c70', tone:'dark', label:'蓝调', sky:['#344e79','#8b9baa'], building:'#465c74', sun:'#91bbef', sunPower:.5, sunPosition:[4.7,6.2,-8], ambient:.4, fill:.22, floor:65, desk:65, moon:true, clouds:.2 },
  night: { backdrop:'#182e29', backdropGlow:'#263f35', tone:'dark', label:'夜晚', sky:['#111d32','#35465a'], building:'#263846', sun:'#9cbeff', sunPower:.25, sunPosition:[4.7,6.2,-8], ambient:.27, fill:.2, floor:80, desk:70, moon:true, clouds:.05 },
  candle: { backdrop:'#202823', backdropGlow:'#2e352b', tone:'dark', label:'烛光', sky:['#0c1524','#253044'], building:'#1d2b3a', sun:'#92abd0', sunPower:.12, sunPosition:[4.7,6.2,-8], ambient:.11, fill:.07, floor:0, desk:0, moon:true, clouds:0 },
} as const;
export type Atmosphere = keyof typeof atmospheres;

// Matching opaque surfaces keep small labels crisp against every weather palette.
function surfaces(ink:string,surface:string,border:string,hover:string,selected:string,accent:string){
  return {'--surround-ink':ink,'--surround-surface':surface,'--surround-border':border,'--surround-hover':hover,'--surround-selected':selected,'--room-accent':accent};
}
export const atmosphereSurfaces = {
  sunny:surfaces('#595749','#f7f2e8','#dcd4c5','#fffaf1','#e8e3d5','#927150'),
  rain:surfaces('#485851','#e4eae3','#b8c7be','#eff3ec','#cddbd0','#8a7159'),
  snow:surfaces('#52605b','#f3f5ee','#d0d9d1','#fcfdf8','#dfe7dd','#8b7964'),
  sunset:surfaces('#654b3d','#f4e5d4','#d3b49d','#fff0df','#e6ceba','#8c5940'),
  blue:surfaces('#ede9dc','#4f6469','#718587','#5d7477','#657d7d','#d7c6a6'),
  night:surfaces('#e4dfcc','#294238','#4a6151','#354f41','#46614e','#d4bc8d'),
  candle:surfaces('#e3dac4','#333c30','#565e49','#414b38','#535d44','#d6b987'),
};
