# 生日不打烊 · Birthday Stays Open

给你留了一块蛋糕，进来坐坐吧。

一个可以慢慢探索的 3D 生日小屋：窗外换天气，电话留着小小的问候，照片背面藏着一句话。摸摸猫、翻翻日历，发现几件小物件，再点亮蜡烛，许个愿。

[进入小屋](https://birthday-stays-open.vercel.app/) · [MIT 许可证](LICENSE)

![生日不打烊的夜晚房间](docs/room-preview.png)

## 小屋里有什么

- 可以拖动视角、靠近物件的 3D 房间；手机上支持双指缩放。
- 晴天、雨天、落雪、夕阳、蓝调、夜晚和烛光，共七种氛围。
- 可拨动的电话、自动放映的电视、可以翻到背面的照片、翻页日历。
- 猫咪、小象、郁金香，以及藏在抽屉和书架附近的小机关。
- 探索、点亮蜡烛、许愿、房间逐渐亮起、读信的生日流程。
- 首次进入时的来电界面，之后直接回到房间；可以随时回听。
- 移动端安全区、顶部容器导航预留、圆角界面和 WebGL 不可用时的简化入口。

## 本地运行

推荐 **Node.js 24 LTS**（最低 22.18）和 npm。

```bash
git clone https://github.com/carpediemzzsssww-cpu/birthday-stays-open.git
cd birthday-stays-open
npm ci
npm run dev
```

打开终端显示的本地地址。无需 API Key、后端服务或环境变量。

```bash
npm run check   # TypeScript 检查
npm test        # 构建两种版本，并运行自动化测试
npm run build  # 离线版本 → dist/
npm run build:web  # 网页版本 → dist-web/
npm run preview   # 预览 dist/，请先构建
```

生产产物是静态文件。请通过 HTTP/HTTPS 访问；不要直接双击 HTML。

## 部署到 Vercel

在 Vercel 导入这个 GitHub 仓库即可。仓库内的 `vercel.json` 已指定：

| 配置 | 值 |
| --- | --- |
| Framework Preset | Other |
| Build Command | `npm run build:web` |
| Output Directory | `dist-web` |
| Node.js | 24.x |

也可以在安装并登录 Vercel CLI 后运行 `vercel --prod`。开源仓库不包含任何人的 Vercel 项目绑定或账号配置。

## 离线小工具版本

`npm run build` 输出单个 HTML 入口、经典脚本和本地资源，使用程序合成的纯音乐，不读取可选的歌曲文件。压缩时将 **`dist/` 内的内容**放在 ZIP 根目录，让 `index.html` 位于根目录。

页面已经考虑移动端容器的顶部导航和安全区：`src/styles/portable.css` 中的 `--host-top` 默认为 `44px`；`--safe-area-inset-top/right/bottom/left` 可由宿主注入，并回退到设备的 `env(safe-area-inset-*)`。

宿主对相机、麦克风、WebGL 和本地存储的支持各不相同，正式上传前仍需用对应平台的最新校验工具检查，并在真机容器内验收。

## 换成自己的内容

| 想修改什么 | 文件 |
| --- | --- |
| 照片、背面短句、电话留言、信 | `src/data/memories.ts` |
| 相册分类 | `src/data/photo-collections.ts` |
| 天气与背景配色 | `src/data/atmospheres.ts` |
| 书架与书名 | `src/data/books.ts` |
| 日历规则 | `src/data/timeline.ts` |
| 房间造型和摆放 | `src/three/room-model.ts` |
| 手机镜头和缩放范围 | `src/three/room-framing.ts` |
| 字体、安全区和界面样式 | `src/styles/` |

`public/memories/` 中是 12 张经过检查的 AI 涂鸦示例，原始私人照片和录音没有包含在仓库中。修改素材后，请先确认内容和使用授权，再运行 `node scripts/record-public-assets.mjs` 更新素材清单。测试会检查清单，防止意外混入额外素材；它不能替代人工隐私检查。

手写字体是精简字符集。新增文案出现缺字时，可换用完整的合法授权字体，并保留对应许可证。

### 背景音乐

开源版本默认使用 Web Audio 合成的纯音乐，网页和离线版本均可直接运行。线上演示所用的额外歌曲不随源码分发。

如果你拥有某段音乐的使用权限，可自行放到 `web-assets/audio/room-theme.mp3`：`npm run build:web` 会将它用于网页版本；不存在这个文件时，自动使用纯音乐。`npm run build` 始终使用纯音乐。`web-assets/` 已被 Git 忽略，不会自动进入仓库。

声音会在用户交互后开始；电话和许愿流程会切换音频状态。普通物件点击不会反复重启背景音乐。

## 数据与兼容性

应用没有账号系统、统计 SDK 或业务数据上传接口。探索进度保存在本设备的 localStorage；拍立得保存在本设备的 IndexedDB。相机、麦克风只在用户主动触发对应功能时申请，是否可用取决于 HTTPS 和宿主权限。

3D 场景需要 WebGL 2。代码提供了简化入口和渲染预算控制；不同手机的图形性能和音频策略仍有差异，建议在目标设备上检查体验。

## 开源与素材许可

本项目原创代码和可授权的示例内容沿用仓库的 [MIT 许可证](LICENSE)。第三方字体、组件和图标保留各自许可，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)、[FONT-LICENSE.txt](FONT-LICENSE.txt) 和 [public/licenses.json](public/licenses.json)。书名只作为场景文字展示，不包含书籍正文或官方封面。

欢迎提交问题和改进。提交前请运行 `npm run check` 和 `npm test`，并确认没有带入自己的照片、录音、密钥或部署配置。
