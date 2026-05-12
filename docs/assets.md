# 美术素材规范

## 用途
本文档列出游戏需要的所有 sprite 资源。
**生成流程**:AI 出图(白底) → PS 抠图(白底变透明) → 存为 PNG → 放入 `src/assets/`。
代码端通过 `assetLoader.js` 在游戏启动前预加载,缺图时用占位色块顶替,不影响调试。

---

## 文件位置

```
src/assets/
  ├── atom_d.png            (必需)
  ├── atom_t.png            (必需)
  ├── atom_li6.png          (必需)
  ├── hazard_tungsten.png   (必需)
  ├── boost_nbi.png         (必需)
  └── hud_he4.png           (可选,做了更带感)
```

文件名严格匹配上面的拼写,代码里硬编码了。

---

## 素材清单(总览)

| 文件名 | 尺寸 (px) | 类型 | 用途 |
|---|---|---|---|
| `atom_d.png` | 96×96 | 收集物 | 氘原子,游戏内拾取 + HUD 燃料舱 D 槽位共用 |
| `atom_t.png` | 96×96 | 收集物 | 氚原子,同上 |
| `atom_li6.png` | 96×96 | 收集物 | 锂-6 原子,稀有物,撞到自动转化为 1 个 T |
| `hazard_tungsten.png` | 80×80 | 软障碍 | 钨碎片,撞到不死,温度倒退 1 档 + 红屏闪 |
| `boost_nbi.png` | 240×72 | 加成通道 | NBI 中性束加热,穿过 +1 温度档 + 0.5s 金光 |
| `hud_he4.png`(可选) | 64×64 | HUD 图标 | 氦-4 核,聚变完成计数器图标 |

HUD 槽位的"暗/亮"两态由 CSS filter 控制(暗 = `grayscale(1) opacity(0.3)`),**不需要做两版**,一张亮版图就行。

---

## 详细规格

### 1. `atom_d.png` —— 氘原子(D)
- **尺寸**:96 × 96 px
- **画面内容**:
  - 中心:1 个**蓝色质子球** + 1 个**灰色中子球**(贴在一起)
  - 外围:1 条**椭圆电子轨道**,轨道上 1 个小亮点(电子)
  - 正中:叠加白色加粗大写字母 **"D"**(让玩家秒懂这是氘)
- **主色**:#44ddff(青蓝霓虹)
- **风格**:科幻 / 合成波,辉光柔和,黑底显眼
- **核心识别**:"原子核 + 字母 D"

### 2. `atom_t.png` —— 氚原子(T)
- **尺寸**:96 × 96 px
- **画面内容**:
  - 中心:1 个**绿色质子球** + 2 个**灰色中子球**(三粒贴一起)
  - 外围:1 条电子轨道 + 1 个电子亮点
  - 正中:叠加白色加粗 **"T"**
- **主色**:#66ff99(荧光绿)
- **风格**:同 D,色调换绿
- **核心识别**:"比 D 多一个中子 + 字母 T"

### 3. `atom_li6.png` —— 锂-6 原子(⁶Li)
- **尺寸**:96 × 96 px
- **画面内容**:
  - 中心:3 个**紫色质子** + 3 个**灰色中子**(6 粒紧密簇拥,比 D/T 明显大一圈)
  - 外围:**3 条**电子轨道(交叉成立体感),每条 1 个电子亮点
  - 正中:叠加白色 **"⁶Li"**(数字 6 是上标,小一点)
- **主色**:#cc88ff(紫银)
- **风格**:辉光**比 D/T 更强**(它是稀有物,要让玩家眼前一亮)
- **核心识别**:"明显更大、更亮、紫色、有上标 6"

### 4. `hazard_tungsten.png` —— 钨碎片
- **尺寸**:80 × 80 px
- **画面内容**:
  - 不规则破碎金属碎片簇 / 多边形尖刺(像被砸碎的钢铁碎屑)
  - 锐利棱角,工业质感
  - 表面带高光反射,**不要圆润**
- **主色**:#aab0bb(冷灰)+ 蓝白冷光高亮
- **风格**:危险但不血腥 —— 工业事故感,**不要红色**(红色留给爆炸)
- **核心识别**:"一看就是金属碎屑,会扎人"

### 5. `boost_nbi.png` —— NBI 中性束加热
- **尺寸**:240 × 72 px(横向长条)
- **画面内容**:
  - 横向粒子流,从左到右流动感
  - 中间最亮、两端渐隐(羽化淡出,无锐利边)
  - 内部有更亮的横向速度线 / 粒子轨迹
  - 整体像一束高速注入的能量带
- **主色**:#ff44aa(洋红)→ 中心 #ffaadd → 边缘透明
- **风格**:能量感、通透、不闷,有"加速带"既视感
- **核心识别**:"一条横着的粉色能量带,玩家想穿过去"
- **注意**:这是横向元素,**两端必须羽化透明**,否则游戏里会看到生硬切边

### 6. `hud_he4.png` —— 氦-4 核(可选)
- **尺寸**:64 × 64 px
- **画面内容**:
  - 中心:2 个**金色质子** + 2 个**灰色中子**
  - 外围:1 条电子轨道(2 个电子亮点也行)
  - 正中:叠加白色 **"He⁴"**(数字 4 是上标)
- **主色**:#ffcc44(金色)
- **风格**:辉光最强烈,有"成就感 / 胜利感"(它是聚变产物)
- **核心识别**:"金光闪闪,一看就是好东西"

---

## 通用风格规范

所有素材必须满足以下硬约束,否则集成进游戏会出问题:

### 背景
- **纯白底**:RGB (255, 255, 255),**不要渐变白**(渐变白抠图后会留下灰色边晕)
- 抠图后导出**透明 PNG**

### 边距
- 主体不要贴边,**四周留 8–10 px 透明边距**(防止 PS 抠图时切到内容)

### 边缘
- 边缘要**清晰**,不要 AI 常出的"模糊光晕外延"(那种光晕抠图时很难处理)
- 如果原图有强发光,可以接受,但要保证"主体本身的边界清晰可识别"

### 文字
- 原子上的 **D / T / ⁶Li / He⁴** 字母,要白色加粗、清晰可读
- 如果 AI 出图后字看不清,**用 PS 单独再加一层文字**,不要硬凑

### 风格关键词
- 复古霓虹 / 合成波(vaporwave / synthwave)
- 黑底友好(游戏背景是黑的,所以素材在黑底上要好看)
- 80 年代科幻配色

---

## AI 生成 prompt 模板

直接把下面这个前缀拼到每张图的具体描述前:

```
Vaporwave neon retro game icon, science illustration of {OBJECT},
glowing particles, dark-friendly design, pure white background only,
clean sharp edges (no soft glow bleeding into background),
centered composition with 10px margin,
80s synthwave color palette, high detail, 1:1 ratio (or 240:72 for NBI beam)
```

把 `{OBJECT}` 换成具体描述,例如:

| 文件 | 替换为 |
|---|---|
| `atom_d.png` | `a deuterium atom with 1 proton and 1 neutron in nucleus, electron orbiting, large white letter "D" overlay in center, cyan blue glow color #44ddff` |
| `atom_t.png` | `a tritium atom with 1 proton and 2 neutrons in nucleus, electron orbit, large white letter "T" overlay, fluorescent green glow #66ff99` |
| `atom_li6.png` | `a lithium-6 atom with 3 protons and 3 neutrons clustered tightly, 3 crossing electron orbits, white "⁶Li" label, purple silver glow #cc88ff, brighter than other atoms` |
| `hazard_tungsten.png` | `shattered tungsten metal fragments, sharp angular polygon shards, industrial cold gray #aab0bb with blue-white highlights, dangerous but not bloody, no red` |
| `boost_nbi.png` | `horizontal magenta particle beam stream, brightest in center fading to transparent at both ends, motion trail lines inside, neutral beam injection energy band, magenta #ff44aa to pink #ffaadd, FEATHERED EDGES, 240x72 horizontal banner format` |
| `hud_he4.png` | `helium-4 nucleus with 2 golden protons and 2 gray neutrons, electron orbit, white "He⁴" label, golden #ffcc44 victory glow, achievement feel` |

**生成多张选最好看的**。AI 出图随机性大,推荐每张至少出 4 张选 1 张。

---

## 验收清单

每张图入库前,过一遍:

- [ ] 文件名拼写完全匹配本文档(大小写敏感)
- [ ] 尺寸正确(96×96 / 80×80 / 240×72 / 64×64)
- [ ] 背景已抠成透明(PS 里关闭白色图层后看,棋盘格干净不带灰晕)
- [ ] 主体四周有 8-10 px 透明边距
- [ ] 字母 / 标签清晰可读(在 32×32 缩略图下也能认出 D/T/⁶Li/He⁴)
- [ ] 主色与本文档规格大致吻合(±色相 10° 之内)
- [ ] 边缘锐利,无明显模糊外延
- [ ] 黑底测试:在黑色画布上预览一下,主体能"跳出来"

---

## 缺图时的兜底

如果某张图没生成出来,代码端 `assetLoader.js` 会用纯色色块占位:
- 收集物 → 圆形色块 + 字母
- 钨碎片 → 灰色尖刺多边形
- NBI → 洋红半透明矩形

所以**部分缺图不会卡开发**,可以分批补齐。先做最影响观感的:`atom_d.png` / `atom_t.png` / `atom_li6.png`(玩家全程都在看)。
