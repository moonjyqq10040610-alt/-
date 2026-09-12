export type MemoryKind = 'frames' | 'calls' | 'film' | 'together' | 'portraits' | 'cats' | 'sunny' | 'magic' | 'books' | 'calendar' | 'tv' | 'elephant';
export interface Memory { id:string; episode:string; category:MemoryKind; carrier:'frame'|'polaroid'|'filmstrip'|'contact-sheet'|'tv'; asset:string; alt:string; backText:string; priority:number; }
export const episodeTitles:Record<MemoryKind,string>={frames:'歪歪合影',calls:'喂？',film:'小小日常',together:'挤在一起',portraits:'一个人的小事',cats:'many cats',sunny:'今天有太阳',magic:'一点魔法',books:'小屋书架',calendar:'今天与明天',tv:'涂鸦放映',elephant:'象象'};
const gallery:[string,MemoryKind,string,string][]=[
 ['01-tree-friends','frames','两位歪歪小人在树下合影','树是绿的，脸是随手画的。'],
 ['02-sofa-friends','frames','挤在沙发上的三个小人','沙发说：还可以再挤一个。'],
 ['03-cafe-friends','together','两位朋友和画歪的咖啡杯','咖啡已经凉了，话还没说完。'],
 ['04-picnic','together','野餐毯旁的一颗巨大橙子','带了水果，忘了带比例尺。'],
 ['05-seaside','portraits','大海边的小小身影','今天的任务：被海风吹歪。'],
 ['06-reading','portraits','红灯旁读书的小人','书还没看完，先把灯留着。'],
 ['07-jump','portraits','穿黄靴子跳过水坑的小人','离地三厘米，也算起飞。'],
 ['08-tulips','film','粉色郁金香和蓝色杯子','花开得很认真，花瓶有点潦草。'],
 ['09-orange-cat','cats','一只圆滚滚的涂鸦橘猫','不是胖，是呼噜声有体积。'],
 ['10-many-cats','cats','五只挤在一起的歪歪猫','人类，请再加五个坐垫。'],
 ['11-magic-room','magic','金色星星漂浮的小房间','今天也允许发生一点小魔法。'],
 ['12-cake','sunny','点着一根蜡烛的小蛋糕','不用等特别的日子，今天就很好。'],
];
export const memories:Memory[]=gallery.map(([file,category,alt,backText],i)=>({id:`doodle-${i+1}`,episode:episodeTitles[category],category,carrier:category==='frames'?'frame':'polaroid',asset:`./memories/${file}.webp`,alt,backText,priority:5}));
export const photo=(index:number)=>memories[((index-1)%memories.length+memories.length)%memories.length];
export {albums} from './photo-collections';
export const callFragments=[
 {time:'叮铃 01',line:'喂？这里是发呆热线。',aside:''},
 {time:'叮铃 02',line:'今天的云，看起来像一块吐司。',aside:''},
 {time:'叮铃 03',line:'猫说它正在忙。\n忙着什么也不做。',aside:''},
 {time:'叮铃 04',line:'热水烧好了。\n给自己倒一杯吧。',aside:''},
 {time:'叮铃 05',line:'如果暂时没主意，\n就先看看窗外。',aside:''},
 {time:'叮铃 06',line:'小屋收到。\n你的愿望正在发芽。',aside:''},
 {time:'叮铃 07',line:'好啦，去摸摸猫。\n它在等你。',aside:''},
];
export const birthdayLetter=[
 '给偶然走进小屋的你：',
 '这里的照片有点画歪了，猫也圆得不太讲道理。没关系，小屋不负责完美，只负责让你歇一会儿。',
 '你可以把晴天留久一点，也可以让窗外下一场小雪。想说话的时候，拨一下电话；不想说话的时候，和猫一起坐着也很好。',
 '抽屉里的星星偶尔会逃跑，咖啡可能有点凉，书页里还夹着没读完的故事。每件小东西，都愿意陪你慢慢发现。',
 '愿你接下来的日子有好睡眠、有好胃口，有想做的小事，也有什么都不做的自由。',
 '愿望已经听到了。今天也请对自己好一点。',
 '下次来，小屋的灯还会亮着。',
];
