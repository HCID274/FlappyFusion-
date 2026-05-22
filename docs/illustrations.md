# 卡片插图规范

## 用途与定位

本文档列出**覆盖层卡片(overlay)上展示的插图**资源 —— 与 `docs/assets.md`(游戏内 sprite)是两套独立体系。

| 文档 | 资源类型 | 显示场景 |
|---|---|---|
| `docs/assets.md` | sprite | 在 canvas 内、与玩家实时交互的实体 |
| `docs/illustrations.md`(本档) | 卡片插图 | overlay 卡片(教学卡、了解更多 modal)上的"插图框" |

**风格统一**:与游戏 sprite 同属 **Vaporwave / Synthwave 霓虹复古风**,深底黑底友好,与 `docs/assets.md` 同色板。插图是**科普示意图(infographic)**,服务于卡片文本,不是拟人卡通。

---

## 协作约定(继承 `docs/assets.md`)

> 用户(美术 / AI 出图)**只提供 2D 静态素材**;一切光晕、动画、特效由代码渲染。

本档**额外约定**:

- ❌ 插图里**不要画文字标签**(D / T / He⁴ / 数字 / 单位字符) —— 文字由 i18n 系统按 audience(kid / teen)叠加在卡片上
- ❌ 不要画 UI 框、对话气泡、按钮、页码 —— 卡片框架由 CSS 处理
- ❌ **不要拟人化笑脸 / 卡通表情** —— 信息图本身就该直观
- ✅ 主体居中靠上,**底部 15% 留为纯背景色**(代码叠文字用)
- ✅ kid / teen 共用同图,仅切叠加文字

---

## 文件位置

```
src/assets/
  └── 2x/
      └── illustrations/
          ├── illust_tut_fusion.png       (教学:D+T 核聚变)
          ├── illust_tut_li.png           (教学:Li 中子捕获)
          ├── illust_tut_tungsten.png     (教学:钨碎片)
          ├── illust_tut_nbi.png          (教学:NBI 中性束)
          ├── illust_learn_p1.png         (了解更多 第 1 页:能量密度对比)
          ├── illust_learn_p2.png         (了解更多 第 2 页:磁约束悬浮)
          └── illust_learn_p3.png         (了解更多 第 3 页:糟谷研究室)
```

---

## 素材清单

### 教学卡(4 张,3:2 横向,**600×400**)

游戏内首次遇到新实体时弹出。

| 文件名 | 内容 | 触发时机 |
|---|---|---|
| `illust_tut_fusion.png` | D + T → He⁴ + n | 首次见到 D 或 T |
| `illust_tut_li.png` | Li⁶ + n → He⁴ + T(中子捕获再生) | 首次见到 Li(必定在 D/T 后) |
| `illust_tut_tungsten.png` | 钨碎片(降温危险) | 首次接近钨碎片(屏宽 1/3) |
| `illust_tut_nbi.png` | NBI 中性束(加温加速) | 首次接近 NBI(屏宽 1/3) |

### 了解更多 modal(3 张,12:5 横幅,**480×200**)

死亡卡的 `[了解更多]` 按钮打开 `#screen-learn` 三页 modal,每页内容已在 `content.js` 的 `learnMore` 数组定下。

实际 DOM 约束:`.modal-content { max-width: 540px }`,正文宽度 ~480px,所以插图横幅式贴顶最合理。

| 文件名 | 对应页 | 文本主旨 | 插图主题 |
|---|---|---|---|
| `illust_learn_p1.png` | P1「なぜ核融合を目指すのか?」 | 1g 燃料 ≈ 8t 石油 ≈ 11t 煤,无温室气体,海水提取 | **能量密度对比图**:1g 燃料瓶 vs 一桶石油 vs 一堆煤 |
| `illust_learn_p2.png` | P2「何が難しいのか」 | 难点不是加热,是悬空。磁场把 1 亿度悬浮,ITER 磁体 13T(地球磁场 26 万倍) | **磁约束悬浮原理图**:等离子在磁笼中浮空 |
| `illust_learn_p3.png` | P3「私たちが取り組むこと」 | 糟谷研究室 · 磁约束聚变方向,QR 码占位 | **研究室标识图**:托卡马克轮廓 + QR 占位 |

**共 7 张**,kid/teen 共用同图。

---

## 通用风格规范

继承 `docs/assets.md` 的 sprite 风格:

- **Vaporwave / Synthwave 霓虹复古**
- 主色板:`#44ddff` 青蓝 / `#66ff99` 荧光绿 / `#cc88ff` 紫银 / `#ff44aa` 洋红 / `#ffcc44` 金 / `#aaffff` 电子青 / `#aab0bb` 冷灰
- 背景:深空蓝紫 `#0a0e27`
- 边缘锐利清晰,无模糊外延
- 主体居中靠上,**底部 15% 留为纯背景色**
- **不带任何文字 / 字母标签 / UI 框 / 拟人表情**

---

## AI 出图 prompt(每张直接复制粘贴)

> 出图时**附带 `docs/assets.md` 中已生成的 sprite PNG 作为风格参考**(prompt 中 "matching attached reference" 即指此),保证插图与游戏内 sprite 同一审美。

### 教学卡(600×400)

**`illust_tut_fusion.png`**
```
Vaporwave neon retro science illustration, 80s synthwave style matching attached reference image, dark background #0a0e27. Deuterium atom on left (cyan glow #44ddff, nucleus with 1 proton + 1 neutron, electron orbit), tritium atom on right (fluorescent green glow #66ff99, nucleus with 1 proton + 2 neutrons, electron orbit), colliding at center with sharp energy burst. Helium-4 nucleus emerging upper right (golden glow #ffcc44, 2 protons + 2 neutrons), single white neutron particle flying out lower right with motion trail. Glowing particles, sharp clean edges, no text labels, bottom 15% empty for text overlay, 600x400 horizontal.
```

**`illust_tut_li.png`**
```
Vaporwave neon retro science illustration matching attached reference, dark background #0a0e27. Lithium-6 nucleus center (purple-silver glow #cc88ff, 3 protons + 3 neutrons clustered, crossing electron orbits). White neutron entering from left with motion trail, golden helium-4 nucleus and green tritium atom emerging from right with motion trails. The Li-6 + n → He-4 + T breeding reaction visualized. Sharp edges, glowing particles, no text, bottom 15% empty, 600x400.
```

**`illust_tut_tungsten.png`**
```
Vaporwave neon retro science illustration matching attached reference, dark background #0a0e27. Cluster of jagged angular tungsten metal fragments center (cold gray #aab0bb, blue-white metallic highlights, sharp polygon shards). Downward-pointing arrow or descending thermometer beside them indicating plasma cooling, faint blue cold particles drifting from the fragments. Industrial sci-fi hazard, no red, no blood. Synthwave metallic glow, sharp edges, no text, bottom 15% empty, 600x400.
```

**`illust_tut_nbi.png`**
```
Vaporwave neon retro science illustration matching attached reference, dark background #0a0e27. Horizontal magenta particle beam stream center (#ff44aa to #ffaadd, brightest in middle, feathered fade at both ends). Small pink plasma orb on left entering the beam, same orb on right emerging brighter and larger with upward arrow / rising thermometer indicating temperature increase, acceleration motion trail through the beam. Synthwave energy band, sharp edges, no text, bottom 15% empty, 600x400.
```

### 了解更多 modal(480×200,横幅)

**`illust_learn_p1.png`** —— 能量密度对比
```
Vaporwave neon retro infographic illustration matching attached reference, dark background #0a0e27. Three objects compared horizontally with equal sign or comparison glyphs between them: LEFT a tiny glowing vial labeled by shape only containing pink-magenta fuel #ff44aa (1 gram of deuterium-tritium), MIDDLE a single large oil barrel silhouette (cold gray-blue #44ddff metallic) representing 8 tons of oil, RIGHT a tall mound of coal chunks (dark synthwave purple #6a4a8a) representing 11 tons of coal. The vial is dramatically smaller than the oil barrel which is smaller than the coal mound, visual hierarchy makes the energy density comparison immediately clear. Synthwave science infographic, sharp clean lines, no text, no numbers, bottom 15% empty, 480x200 horizontal banner.
```

**`illust_learn_p2.png`** —— 磁约束悬浮原理
```
Vaporwave neon retro infographic matching attached reference, dark background #0a0e27. Cross-section diagram of a tokamak D-shaped vacuum vessel center: a brilliant pink-magenta plasma orb #ff44aa floats suspended in the middle, completely surrounded by curved cyan magnetic field lines #44ddff forming a torus-shaped containment cage. The plasma never touches the metallic gray chamber walls. Small directional arrows on the magnetic field lines suggest containment force. On one corner, a small inset icon of a metal surface vaporizing into white particles upon plasma contact (showing why containment matters). Synthwave science diagram, sharp clean lines, no text, bottom 15% empty, 480x200 horizontal banner.
```

**`illust_learn_p3.png`** —— 糟谷研究室
```
Vaporwave neon retro emblem illustration matching attached reference, dark background #0a0e27. Centered: a stylized tokamak torus ring silhouette (cyan #44ddff outline with magenta #ff44aa plasma glow at its core), representing the Kasuya lab's magnetic confinement fusion research. To the right of the tokamak emblem, a clearly defined square placeholder area for a QR code (white square with subtle synthwave border, intentionally blank to be replaced). Synthwave laboratory emblem composition, sharp clean lines, no text, bottom 15% empty, 480x200 horizontal banner.
```

---

## 验收清单

每张图入库前过一遍:

### 通用(7 张都要满足)
- [ ] 文件名拼写完全匹配(大小写敏感)
- [ ] 尺寸正确(教学卡 600×400 / learn modal 480×200)
- [ ] 画面内**无任何文字 / 字母标签 / 数字 / UI 框 / 拟人表情**
- [ ] 底部 15% 留为纯背景色(代码叠文字用)
- [ ] 主色与本档色板吻合(±色相 10° 之内)
- [ ] 边缘锐利,无明显模糊外延
- [ ] 黑底测试:在游戏深底 `#0a0e27` 上预览,主体明显跳出
- [ ] 与 `docs/assets.md` 的 sprite 并排时**风格统一**

### 教学卡专属
- [ ] 4 张同一风格强度,不会某张特别花哨某张特别素
- [ ] **fusion 卡**:能读出 "D + T 碰撞 → He⁴ + n 飞出" 的物理流向
- [ ] **li 卡**:能读出 "中子进 → He⁴ + T 出" 的反应方向
- [ ] **tungsten 卡**:危险指示**不用红色**(红色留给代码闪屏),用冷色 + 下降箭头
- [ ] **nbi 卡**:加速感**不用红/橙**(那是温度),用洋红能量带 + 上升箭头

### 了解更多 modal 专属
- [ ] **p1**:一眼看出"小燃料瓶 vs 大油桶 vs 更大煤堆"的体积/质量对比 —— 视觉冲击是关键
- [ ] **p2**:一眼看出"等离子悬浮在磁笼中,不碰壁"的核心信息
- [ ] **p3**:QR 占位方块边界清晰,后期 PS 替换 QR 码无修图困难
- [ ] 3 张视觉风格一致,翻页时不跳戏

---

## 缺图兜底

代码端 `assetLoader.js` 会用占位顶替:
- 教学卡缺图 → overlay 内插图节点 `display:none`,卡片照常显示标题 + 文本
- learn modal 缺图 → 顶部插图节点 `display:none`,正文 + 翻页正常

**部分缺图不会卡开发**,可分批补齐。

### 推荐补齐顺序(影响观感由大到小)

1. **`illust_learn_p1.png`** —— 石油煤对比是开放日最有冲击力的画面,家长一看就懂
2. `illust_tut_fusion.png` —— 几乎每个玩家都会触发
3. `illust_learn_p2.png` —— 第二页磁约束,有 ITER 数据加持
4. `illust_learn_p3.png` —— 研究室标识(QR 码 PS 后期接入)
5. `illust_tut_li.png` / `illust_tut_nbi.png` / `illust_tut_tungsten.png`
