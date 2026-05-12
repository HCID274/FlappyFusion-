# 美术素材规范

## 用途
本文档列出游戏需要的所有 sprite 资源。
**生成流程**:AI 出图(白底,**背景板例外**) → PS 抠图 / 裁切 → 存为 PNG → 放入 `src/assets/`。
代码端通过 `assetLoader.js` 在游戏启动前预加载当前 gameplay / HUD 必需素材,缺图时用占位色块顶替,不影响调试。背景板由 Task 4 接入渲染时再注册或延迟加载。

---

## 协作约定 — 素材职责边界(重要)

**这条约定是这份文档最关键的一句话,所有美术与代码工作流都基于它**:

> 用户(美术 / AI 出图)**只提供 2D 静态素材**。
> 所有 **光晕、辉光、脉动、粒子、闪烁、滤色、Combo 字效、阶段切换闪光、自维持迸射、进度条动画、震屏** 等动态视觉元素,**全部由代码运行时绘制**(`renderer.js` + `particleSystem.js` + `theme.js`)。

### 为什么这样分工
1. **可调性**:数值和动画曲线常调,代码改一行 vs 重出图一遍,杠杆完全不同
2. **轻量**:全套素材控制在 ~1 MB 以内,展位机首屏加载快
3. **兜底**:任何 sprite 缺失,assetLoader 都能用纯代码绘制顶替,游戏照常跑

### 美术该做的
- 出"**这个东西本身**":原子的核 + 轨道、钨碎屑的形状、NBI 束的色带、背景板的几何与设备元素
- 边缘清晰、白底(背景板除外)、透明 PNG

### 美术不该做的(代码会处理)
- ❌ 给原子加"飘浮辉光晕"——代码会按 phase / combo 状态动态加
- ❌ 给背景板加"等离子体光晕脉动"——代码 radialGradient 叠加
- ❌ 在素材里画文字飘字——代码 Canvas 绘字
- ❌ 在素材里画粒子尾迹 / 飞溅碎屑——代码粒子系统
- ❌ 画进度条 / HUD 槽位框 / Combo 圆环——全部代码 + CSS
- ❌ 在背景板画动画帧——背景板必须是单帧静图

### 一句话比喻
**美术做"演员",代码做"灯光、舞美、烟雾机、特技"**。演员只要长得对、轮廓清晰,剧场效果由舞台机械合成。

---

## 文件位置

```
src/assets/
  └── 2x/                    (高清源图;代码只加载此目录)
      ├── background_tokamak.png
      ├── atom_d.png
      ├── atom_t.png
      ├── atom_li6.png
      ├── hazard_tungsten.png
      ├── boost_nbi.png
      └── hud_he4.png
```

文件名严格匹配上面的拼写,代码里硬编码了。`src/assets/2x/` 是唯一素材源目录:显示尺寸、碰撞盒、玩法坐标全部仍按 1x 逻辑尺寸计算,只提升渲染清晰度。若某张图缺失,代码会返回 `null` 并使用纯代码兜底绘制,不会再打包 1x fallback PNG。

---

## 素材清单(总览)

| 文件名 | 尺寸 (px) | 类型 | 用途 |
|---|---|---|---|
| `background_tokamak.png` | 800×600 | 背景板 | 全屏铺底的托卡马克真空室内部视图,**静态单帧** |
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

### 7. `background_tokamak.png` —— 托卡马克环背景板(新增 / 必需)

> 这是**整局游戏的视觉氛围基底**,玩家"站在 D 形真空室内部"的沉浸感全靠它。
> 严格遵守"素材是静态、特效靠代码"的协作约定(见本文档开头)。

#### 7.1 尺寸与格式
- **尺寸**:800 × 600 px(与画布等大,**铺满**)
- 格式:PNG,**不需要透明背景**(整张铺底,不抠图)
- 文件大小目标:< 400 KB(JPEG 质量的 PNG 优化即可)

#### 7.2 视角与构图
- **视角**:**从托卡马克 D 形真空室内部往外看**,像一个等离子体的第一人称视角
- **构图重点**:
  - 上下两条**深色金属圆弧**轮廓(暗示 D 形截面的上下壁)
  - 远处中心区域留出**最暗的"画布中央通道"**,让等离子体光球在那里飞行时最显眼
  - 左右两侧可以隐约带**偏滤器板的金属构件 / 散热鳍片纹理**(只是氛围,真正的偏滤器是 sprite)
  - 远景可见 **磁体线圈 / D 形真空室肋骨结构 / 诊断窗口** 的暗轮廓
- **不要画**:
  - ❌ 等离子体本身(那是动态的,代码绘制)
  - ❌ 任何运动模糊 / 拖尾 / 粒子(代码绘制)
  - ❌ 任何文字 / 标签
  - ❌ 任何会反复出现的小细节(玩家盯久了会发现"那里有个红点没动过")

#### 7.3 配色与亮度(关键)
- **整体压低**:**所有像素亮度上限约 35%**(即避免任何接近纯白的高光)
- 主色调:深空蓝紫 `#0a0e27` ~ `#1a1e3a` 为底
- 金属构件:暗钢色 `#2a3045` ~ `#4a5060`,可有冷蓝高光 **不超过 #6080a0**
- 隐约可见的暖色提示:角落里少量 `#3a2030`(暗红铜)作为偏滤器板的暖调点缀
- **绝对禁止**:任何亮金、亮红、亮洋红 — **那些颜色全部留给代码绘制的特效层**

> 一个判断标准:**把背景板和等离子体光球(亮粉色洋红 `#ff44aa`)叠在一起,光球必须明显"跳"出来,而不是被淹没**。如果不确定,把背景板再压暗 20%。

#### 7.4 风格关键词
- 复古霓虹 / 合成波,但**克制版**
- 工业 sci-fi,80 年代实验室质感
- 沉静、深邃、有"工程现场"感
- **不闪亮、不浮夸** — 像深夜的核电站控制室,而不是夜店

#### 7.5 代码会在这张图之上做什么
- 阶段辉光层 radialGradient 叠加(深蓝 / 洋红 / 红橙 / 金 / 白热五档)
- 0.6 Hz 呼吸脉动(全局透明度变化)
- 滚动的视差远景磁力线(若干条 SVG 风路径,代码画)
- 危险区红色脉动(玩家贴炉壁时,顶部 / 底部叠红)
- 点火高潮相的全屏金光叠加 + 边缘 vignette
- 自维持成功的全屏白闪 + 径向粒子迸射

所以背景板本身**越"无聊"越好**,把舞台留给代码。

#### 7.6 缺图兜底
- 缺这张图时,代码用纯色填充 `#0a0e27` + 几条静态磁力线弧 顶替
- 缺图状态下游戏完全可玩,只是失去"在真空室里"的沉浸感

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

### 背景板 AI prompt(单独一条,不走通用前缀)

`background_tokamak.png` 是铺满画面的氛围底,要求和原子 / 障碍完全不同——**深、暗、广角、无运动元素**。建议 prompt:

```
Wide first-person interior view of a tokamak vacuum vessel,
looking down the D-shaped torus chamber, dark industrial sci-fi,
faint metallic divertor plates on left and right edges,
suggestion of superconducting magnet coils and diagnostic ports in deep background,
empty center channel for a plasma to fly through,
deep space blue-purple #0a0e27 dominant, brightness capped at 35%,
NO plasma glow, NO particles, NO text, NO motion blur, NO bright colors,
single static frame, cinematic synthwave but restrained,
800x600 resolution, photorealistic but stylized
```

**重要负面提示**:把"NO plasma, NO bright glow, NO neon highlight"明确写进 negative prompt(如果模型支持)。AI 默认会把"托卡马克"画得很亮,要主动压暗。

**生成 6–8 张选一**,这张图比原子更挑画面,值得多试几次。

---

## 验收清单

### 通用 sprite(原子 / 钨 / NBI / He⁴)

每张图入库前,过一遍:

- [ ] 文件名拼写完全匹配本文档(大小写敏感)
- [ ] 尺寸正确(96×96 / 80×80 / 240×72 / 64×64)
- [ ] 背景已抠成透明(PS 里关闭白色图层后看,棋盘格干净不带灰晕)
- [ ] 主体四周有 8-10 px 透明边距
- [ ] 字母 / 标签清晰可读(在 32×32 缩略图下也能认出 D/T/⁶Li/He⁴)
- [ ] 主色与本文档规格大致吻合(±色相 10° 之内)
- [ ] 边缘锐利,无明显模糊外延
- [ ] 黑底测试:在黑色画布上预览一下,主体能"跳出来"

### 背景板 `background_tokamak.png` 专属

- [ ] 文件名拼写完全匹配
- [ ] 尺寸正好 800×600,无透明背景
- [ ] **亮度测试**:转灰度后直方图大部分像素 < 35%(可在 PS 用色阶检查)
- [ ] **跳出测试**:在 PS 上把一颗 `#ff44aa` 的实心圆放在画面中央,圆**明显跳出**而不是被背景纹理淹没
- [ ] 图内**没有任何亮的红 / 金 / 洋红高光**(这些留给代码)
- [ ] 图内**没有文字、粒子、运动模糊**
- [ ] 视觉重心**不在画面中央**(中央通道要保持沉静)
- [ ] 文件大小 < 400 KB

---

## 缺图时的兜底

如果某张图没生成出来,代码端 `assetLoader.js` 会用纯色色块占位:
- 背景板 → 纯色 `#0a0e27` + 几条静态磁力线弧
- 收集物 → 圆形色块 + 字母
- 钨碎片 → 灰色尖刺多边形
- NBI → 洋红半透明矩形

所以**部分缺图不会卡开发**,可以分批补齐。

### 推荐补齐顺序(影响观感由大到小)
1. `background_tokamak.png` — 没它整局都是黑底,沉浸感最低
2. `atom_d.png` / `atom_t.png` — 玩家全程在看
3. `atom_li6.png` — 出现频率虽低,但识别度要求高
4. `hazard_tungsten.png` / `boost_nbi.png` — 占位色块也勉强可读
5. `hud_he4.png` — 可选,不做也行
