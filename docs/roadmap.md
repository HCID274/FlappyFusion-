# 开发路线图 — 核聚变 Flappy 科普小游戏

> 本文档是**实施阶段的总调度**。配套四份权威设计文档已固化:
> - `architecture.md` — 代码组织
> - `game-design.md` — 玩法与数值(GDD)
> - `content.md` — 玩家可见文字与字效动画
> - `assets.md` — 美术素材规范
>
> 本文档**不重复设计内容**,只编排"什么时候做什么、为什么"。每个任务的细节都标了对应文档章节,实施时去查权威源。

---

## 1. 现状盘点(2026-05-12)

### 1.1 代码侧已实现
- 引擎层完整(`gameLoop` / `stateMachine` / `eventBus` / `events`)
- 实体:`plasma`、`obstacles/divertor`、`obstacles/instability`、`collectibles/deuterium`、`collectibles/tritium`、`collectibles/atomBase`
- 系统:`input` / `spawn` / `particleStream` / `physics` / `collision` / `fusion` / `score` / `temperature` / `difficulty` / `particle` / `cleanup`
- 表现:`renderer`(纯几何 + 网格背景 + 粒子云 + combo 飘字) / `hud`(视觉化燃料舱 + Combo 圆环) / `screens`
- 基础设施:`config` / `theme` / `content` / `i18n` + 双语 catalog 已有
- 单局玩法跑得通:撞墙 / 撞偏滤器 / 撞不稳定区死亡,D+T 触发聚变 +5 分,温度爬升 + 里程碑飘字

### 1.2 代码侧**未实现**(对照三份文档应有)

按文档章节分组:

**第一波(memory 标记"4 天前已固化")**
- `config.js` 仍是 v0×1/3 速度档(drift=70 / baseSpeed=55 / stepEveryNObstacles=2),需 ×2 到 GDD §11 当前值
- 缺 `entities/hazards/tungsten.js`(GDD §5.3)
- 缺 `entities/boosts/nbi.js`(GDD §5.4)
- 缺 `entities/collectibles/lithium6.js`(GDD §6.2)
- 缺 `assetLoader.js`(architecture §4.5)
- `world.js` 缺 `hazards[]` / `boosts[]`
- `events.js` 缺 `EV.HAZARD_HIT` / `EV.BOOST_TRIGGERED`
- HUD 还是纯文本字符串,**没做视觉化燃料舱**(GDD §10.2)
- 没接素材,所有原子靠几何绘制

**第二波(本次会话固化)**
- 缺温度阶段相(GDD §7.4)
- 缺点火高潮相(GDD §7.5)
- 缺点火持续条 HUD(GDD §10.6)
- 缺背景板加载与阶段辉光叠层(GDD §13.1, assets.md §7)
- 缺死亡卡片 `{ignitionLine}` 渲染(content.md §8.2)
- 死亡卡片占位符不全:缺 `{maxCombo}` / `{ignitionSeconds}` / `{selfSustained}`(content.md §1.3)
- `events.js` 缺 `EV.PHASE_CHANGED` / `EV.IGNITION_TICK` / `EV.SELF_SUSTAIN_ACHIEVED`

### 1.3 素材交付状态

用户已生成 7 张图,**位置和命名都不符合 `assets.md` 规范**:

| 现状(`dist/assets/`) | 规范(应在 `src/assets/`) | 状态 |
|---|---|---|
| `D.png` | `atom_d.png` | 需重命名 + 迁移 |
| `T.png` | `atom_t.png` | 需重命名 + 迁移 |
| `Li.png` | `atom_li6.png` | 需重命名 + 迁移 |
| `钨碎片.png` | `hazard_tungsten.png` | 需重命名(中文名不能用) + 迁移 |
| `NBI 中性束加热.png` | `boost_nbi.png` | 需重命名(含空格不能用) + 迁移 |
| `He.png` | `hud_he4.png` | 需重命名 + 迁移 |
| `background_tokamak.png` | `background_tokamak.png` | ✅ 只需迁移 |

> ⚠️ `dist/` 是 Vite build 产物目录,**不应该手动放素材** —— `dist/` 会被 `.gitignore`,而且 `npm run build` 会清空它。素材必须放在 `src/assets/`,Vite 会在 build 时把它复制到 `dist/`。

### 1.4 文档侧已完成
四份设计文档已固化(architecture / game-design / content / assets),本路线图无需再修改它们。**实施过程中如发现设计需要调整,必须先改文档再改代码**(architecture §3.4 DRY 守则)。

---

## 2. 总体策略

### 2.1 为什么分 4 个任务

把所有改动揉成一个 PR / 一次会话不现实,理由:
- AI coding 多轮迭代下,**改动越大,出错和退化的概率越高**
- 每个任务完成后,需要本地实际跑一局确认手感,这是**只有人类能做的验收**
- 把功能从"够用"推到"惊艳"需要分层叠加,**底层不稳就堆不上层**

每个任务的目标是:**完成它之后,游戏能稳定地交付一个清晰的体验升级**,可以单独 demo 给同事看。

### 2.2 任务依赖

```
Task 1 (基础校准 + 第一波元素)
    ↓
Task 2 (粒子云 + Combo + 高潮窗)
    ↓
Task 3 (阶段相 + 点火高潮 + 自维持)
    ↓
Task 4 (视觉合成层 + 屏幕级 FX)
```

严格串行。**不允许跨任务范围实施** —— 比如 Task 1 不允许"顺手把粒子云加上",因为这会让验收边界模糊、回归风险扩大。

### 2.3 实施纪律(每个任务都要遵守)

- **数值**只从 `config.js` 来,文档权威源 `game-design.md §11`。先改 GDD 再同步 config。
- **文案**只从 `content.js` 双语 catalog 来,文档权威源 `content.md`。每条 key 必须 `zh` + `ja` 同步。
- **事件名**只从 `engine/events.js` 来,禁止裸字符串。
- **新事件**在 `events.js` 加常量、JSDoc 说清谁发谁订阅。
- **新模块**走 architecture §10 的扩展点表,不要改框架。
- **System 之间**只通过 EventBus 通信,不直接调方法。
- **Renderer 只读 World**,不要在 render 里改世界状态。
- **构建必须过 i18n 校验**(`npm run check:i18n`),硬编码中日文字会 fail。

---

## 3. Task 1 — 基础校准 + 素材接入 + 第一波元素

### 3.1 前因
- 4 天前已经在 GDD/content/assets 里固化了一批改动(锂-6、钨、NBI、视觉化燃料舱、速度 ×2、assetLoader),但代码侧没动
- 用户已交付素材,但文件名和位置不符规范
- 当前游戏跑起来"过慢、过单调",这一波本身就是为了补齐这个体验差距

### 3.2 后果(完成后游戏的状态)
- 节奏明显变快(滚速从 55 → 110 px/s,温度爬升从每 2 障碍 → 每 4 障碍,起步约 3 秒一障碍而非 6 秒)
- 场景里**多出三种元素**:稀有的紫银 ⁶Li(自动 +1 T)、冷灰钨碎片(撞到不死但温度倒退)、洋红 NBI 中性束(穿过 +1 温度)
- HUD 左上变成**视觉化燃料舱**:只显示已有 D/T,前三个展开、后续半遮堆叠 + 凑齐时 `⚡ 聚变就绪 ⚡` + He⁴ 累计
- **看到素材了** —— 原子、钨碎片、NBI 不再是几何色块,而是用户提供的 PNG sprite

### 3.3 开发理由
- 这一波是"**已经设计完没干的事**",优先级最高 —— 后续 Task 2/3/4 全部依赖这一波建立的基础(尤其是 assetLoader,Task 4 加背景板会复用)
- 视觉化燃料舱是 GDD §10.2 的明确要求,**没它玩家就没法直观看到自己在攒 D / T**,这是聚变机制能不能传达的关键
- 把素材规范化放在最前,**避免后面每个任务都在路径和命名上踩坑**

### 3.4 改动范围

#### 前置准备:素材规范化
- 把 `dist/assets/` 里 7 张图全部迁移到 `src/assets/`,按 `assets.md §文件位置` 的命名表重命名(详 §1.3)
- 添加 `.gitkeep` 或直接把 `src/assets/*.png` 纳入 git(不要忽略)
- 检查图能在 PS 黑底上"跳出来",必要时回退给美术重压暗

#### 代码:基础设施
- 新建 `src/assetLoader.js`,按 architecture §4.5 实现:启动时预加载 Task 1 gameplay / HUD 必需 PNG;背景板保留到 Task 4 接入渲染时再注册或延迟加载;缺图返回占位标志、Entity render 时检测到则回退几何绘制
- `events.js` 增加 `EV.HAZARD_HIT`、`EV.BOOST_TRIGGERED`
- `world.js` `resetWorld()` 增加 `world.hazards = []` 与 `world.boosts = []`

#### 代码:数值校准
- `config.js` 整体对齐 GDD §11 当前值(plasma / obstacle / scroll / temperature / hazards / boosts / score / fusion / collectible 所有字段),**不要遗漏**

#### 代码:新增三个 entity
- `entities/collectibles/lithium6.js`(GDD §6.2)
- `entities/hazards/tungsten.js`(GDD §5.3)
- `entities/boosts/nbi.js`(GDD §5.4)
- 三者结构对照 architecture §4.2 接口契约 + §6 数据结构 typedef

#### 代码:Spawn / Collision / Fusion / Temperature 系统改造
- `spawnSystem.js`:在主线 spawn 之后,按当前温度阶段的 `phases.rules.tungstenSpawn` / `nbiSpawn` **额外掷骰**生成钨 / NBI;D/T spawn 改成走 `typeWeights`(含 Li6 10%)
- `collisionSystem.js`:遍历 `world.hazards` 与 `world.boosts`,命中后发 `EV.HAZARD_HIT` / `EV.BOOST_TRIGGERED`
- `fusionSystem.js`:`COLLECTIBLE_HIT` 处理 `Li6` —— 视作"自动 +1 T"
- `temperatureSystem.js`:订阅 `EV.HAZARD_HIT`(扣 1 档,夹到 start)与 `EV.BOOST_TRIGGERED`(加 1 档,可触发 milestone)
- `cleanupSystem.js`:扩展到清理 `world.hazards` / `world.boosts`

#### 代码:HUD 视觉化燃料舱
- `index.html` 增加燃料舱 DOM 结构(`#hud-fuel-bay`)
- `hud.js` 重写左上区域:监听 `EV.COLLECTIBLE_HIT` / `EV.FUSION_TRIGGERED` 更新已有燃料图标;前三个展开、后续半遮堆叠;炸开动画;He⁴ 计数弹跳
- `content.js`:加 `hud.fuelBay.fusionReady` 文案 + Li6 / 钨 / NBI 飘字 key(对应 content.md §6.2 / §6.3 / §6.4)

#### 代码:Particle System 飘字扩展
- 新增 Li6 增殖飘字、钨杂质溅射飘字、NBI 加热飘字(content.md §6.2 / §6.3 / §6.4)
- 颜色查 `THEME` 不要硬编码

### 3.5 引用文档
- GDD §5.3 / §5.4 / §6.2 / §10.2 / §11
- content.md §4.2 / §6.2 / §6.3 / §6.4
- assets.md §文件位置 / §1–§6 / §通用风格规范
- architecture.md §4.2 / §4.5 / §10 扩展点表

### 3.6 验收清单(必须人工本地跑一局)
- [ ] 进游戏后,4 张原子图、钨、NBI 都用 sprite 显示(不是几何色块)
- [ ] 节奏明显比原来快,起步约 3 秒一障碍
- [ ] 偶尔出现紫银 Li6,吃到立刻 T 槽 +1 + 飘字
- [ ] 偶尔出现钨,撞到不死,温度倒退 1 档 + 红闪 + 飘字
- [ ] 偶尔出现 NBI,穿过 +1 温度 + 金光 + 飘字
- [ ] HUD 左上是视觉化燃料舱,只显示已有 D/T;前三个展开、后续半遮堆叠,凑齐显示 `⚡ 聚变就绪 ⚡`,聚变后图标炸开 + He⁴ 数字弹跳
- [ ] 删掉任意一张 PNG 重新启动,游戏不崩,自动用几何占位
- [ ] `npm run build` 通过(i18n 校验过)

### 3.7 不在本任务范围
- 粒子云 / Combo / 阶段相 / 点火高潮 / 背景板 / 屏幕级 FX —— 留给后续任务

---

## 4. Task 2 — 自由电子粒子云 + 聚变 Combo + 聚变高潮窗

### 4.1 前因
- Task 1 完成后,玩家会觉得"丰富了一些,但 D/T 还是稀疏,每次聚变也就 +5 分,不够爽"
- 用户在头脑风暴中明确提出"金币密度不够,缺爽感",这是本作单调感的根因
- GDD §5.6 / §6.5 / §6.6 + content.md §7.2 已经把每个机制的数值、文案、动画时间轴都定到帧级

### 4.2 后果(完成后游戏的状态)
- **每秒都有反馈**:屏幕上不断有青白色 +1 数字飞字(粒子云擦过)
- **聚变变成连击**:连续聚变会触发字号 28→72 px、颜色由金到白热的"COMBO ×N" 飘字,带过冲弹性动画
- **聚变后短暂高潮窗**:3 秒内 D/T 更密集,鼓励玩家追着打
- HUD 顶部中央出现 Combo 计时圆环,combo≥2 时显示倒计时,左上燃料舱只承担 D/T/He4 信息

### 4.3 开发理由
- 这一波是"**爽感工程**" —— 把单调的稀缺收集机制升级成密集反馈循环,但**不破坏聚变的稀缺叙事**(粒子云完全和 fuel bay 解耦)
- 这一波技术上是**纯 additive**:不改动既有 spawn 节奏、不改 D/T 行为、不动死亡条件。**回归风险最低**,所以放在阶段相之前做
- 选这一组放在 Task 2 而不是和阶段相合并:阶段相要改 spawn / score / difficulty 多个系统,**和 Combo 一起做会让单次改动太大、验收难定位**

### 4.4 改动范围

#### 代码:事件与状态
- `events.js` 加 `EV.PARTICLE_COLLECTED`(粒子云擦过)
- Combo 可不加单独事件,由 `fusionSystem` 内部维护(简单),也可加 `EV.COMBO_INCREMENT` 让 HUD / particleSystem 解耦订阅 —— **推荐后者**,因为 Combo 字效和圆环都要监听
- `world.js` `resetWorld()` 增加:
  - `world.particleStream = []`(青白色小亮点对象数组,结构同 collectible 但 type='particle')
  - `world.combo = { count: 0, lastTime: -Infinity }`
  - `world.fusionBurst = { active: false, remaining: 0 }`(聚变高潮窗状态)

#### 代码:粒子云生成器(新)
- 新建 `systems/particleStreamSystem.js`(独立 spawn,**不复用 spawnSystem**)
- 按 GDD §5.6 实现:0.25–0.45 s 间隔随机发射 3–6 个粒子,arc / wave / diagonal / line 四种 pattern;y 限制 + 与上一串差 ≥ 80 px;避障 lookahead 200 px
- 注册到 main.js 系统列表(放在 spawn 之后、physics 之前)

#### 代码:碰撞 + 渲染
- `collisionSystem.js` 加遍历 `world.particleStream`,擦过发 `EV.PARTICLE_COLLECTED`,粒子 `collected = true`
- `renderer.js` 加粒子云绘制(青白小点 + 2 px 辉光)
- `cleanupSystem.js` 加清理 `world.particleStream`

#### 代码:Combo 与高潮窗
- `fusionSystem.js` 扩展:每次 `FUSION_TRIGGERED`(内部触发)前,先检查 `world.combo.lastTime` 与当前 `world.elapsed` 的差:
  - ≤ `CONFIG.combo.window`(2.0 s,Task 3 才会按阶段动态变):`count += 1`
  - 否则:`count = 1`
- 分值从 `CONFIG.combo.scoreTable` 查,发 `EV.FUSION_TRIGGERED { combo, score, x, y }`
- Combo 计时器到期、玩家死亡:`count = 0`
- 同一次 `FUSION_TRIGGERED` 也启动 `fusionBurst`:`active = true, remaining = CONFIG.fusion.burstWindow`(3 s)
- 高潮窗内 D/T spawn 概率提升(让 `spawnSystem` 读 `world.fusionBurst.active` 切换 spawnChance)
- 高潮窗内粒子云 spawn 间隔 × `CONFIG.fusion.burstParticleMultiplier`(让 `particleStreamSystem` 读这个状态)

#### 代码:得分
- `scoreSystem.js` 改:`COLLECTIBLE_HIT` 按 D / T(perCollectible) / Li6(perLithium) 切换;`PARTICLE_COLLECTED` 加 perParticle;`FUSION_TRIGGERED` 用事件 payload 的 `score`(已包含 combo 倍率)
- **注意**:Task 2 不应用阶段 ×2 倍率(那是 Task 3 的事),scoreSystem 此时保持 phase=null 处理路径

#### 代码:Combo 飘字
- `particleSystem.js` 增加 combo 飘字渲染器:严格按 content.md §7.2 的时间轴(0–0.08–0.16–0.85–1.35 s)、字号梯度(28→72)、颜色梯度(金→白热)、过冲倍率(1.15→1.40)实现
- Combo 大字生成点基于 `world.plasma.pos.y` 做上下半屏避让,并 clamp 到顶部 HUD 与底部点火条之外
- 飘字内文字来自 content.js 新 key:`combo.label1` ~ `combo.label5`(双语)
- **缺一份"+1"小数字飞字**:`EV.PARTICLE_COLLECTED` 触发,20 px 青白,0.4 s 上飘 30 px(content.md §6.5)

#### 代码:HUD Combo 圆环
- `index.html` 加 `#hud-combo-ring` 容器
- `hud.js` 订阅 `EV.FUSION_TRIGGERED`(显示 + 弹性回弹 + 切色)与每帧 update(更新倒计时填充比例);combo=0 时淡出
- 顶部中央独立布局,48 px 直径,顺时针倒计时(SVG 或 Canvas 都行);最后 0.4 秒红色闪烁

### 4.5 引用文档
- GDD §5.6 / §6.5 / §6.6 / §8 / §10.7 / §11(particleStream / combo / fusion.burst* / score 全部新字段)
- content.md §6.5 / §7.2(combo 完整字效规范) / §7.6
- architecture.md §4.2 / §4.3 / §10 扩展点表

### 4.6 验收清单
- [ ] 游戏运行时屏幕一直有粒子串飘过,擦过有 `+1` 小飞字,**不进燃料舱、不触发聚变**
- [ ] 连续聚变 2 次,出现 `⚡ COMBO ×2  +10` 飘字,字号大于单次聚变
- [ ] 连续聚变 5+ 次,出现 `MAX COMBO  +100` 白热飘字,字号 72 px
- [ ] HUD 顶部中央出现 Combo 圆环,combo≥2 显示,顺时针倒计时,接连击时切色 + 弹性回弹
- [ ] 接不上 combo(超过 2 秒),圆环灰化淡出
- [ ] 每次聚变后 3 秒内,粒子云肉眼可见变密、D/T 出现频率提升
- [ ] 5 秒内多次大 combo,屏幕**没有出现刺眼的高强度白闪**(因为屏幕级 fx 留给 Task 4)
- [ ] `npm run build` 通过

### 4.7 不在本任务范围
- Combo 的**屏幕级 FX**(辉光 / 震屏 / 全屏白闪)留给 Task 4,本任务只做飘字 + 圆环
- 阶段化的 combo 窗口 / 分数倍率留给 Task 3
- 粒子云的"高潮相 ×3 刷新率"留给 Task 3

---

## 5. Task 3 — 温度阶段相 + 点火高潮相 + 自维持

### 5.1 前因
- Task 2 完成后,游戏在"任何时刻"都很爽,但**整局节奏曲线还是平的** —— 玩家感受不到"我在升温、我在升级"
- GDD §7.4 五个阶段相已经设计好了,只是没人实现
- 点火高潮相是 MVP 的爽点引擎(用户在头脑风暴中明确选为 MVP 重点)
- 死亡卡片 T5/T6 现在只能用 `{seconds}` / `{temperature}`,**触不到"点火持续 N 秒"这个最有记忆点的数据**

### 5.2 后果(完成后游戏的状态)
- 跨越每个温度阶段会**屏幕中部飘大字**(`主动加热` / `临界点` / `点火成功` / `突破纪录`)
- 不同阶段的障碍密度、刷新率、combo 窗口、是否生成钨碎片**都不同**,玩家会体感"风格变了"
- 温度到 100 M° 触发**点火高潮相 20 秒**:屏幕金、障碍密、combo 窗 4 秒、D/T 翻倍、分数 ×2、钨停生
- 高潮相底部出现 480×18 进度条,每秒推 5%,5/10/15 秒里程碑闪字
- 撑满 20 秒触发**自维持成功**:`+200`、200 粒径向迸射、`自维持成功!` 96 px 主标(此步骤的视觉烟火留 Task 4,本任务先把数据流和文字打通)
- 死亡卡片 T5/T6 显示"你在点火持续期撑了 N 秒"或"你完成了一次自维持燃烧"

### 5.3 开发理由
- 这一波是"**叙事层次**" —— 把游戏从"一直在玩"升级成"前期 / 中期 / 高潮 / 收尾",这是单局完整体验的关键
- 阶段相把 GDD 里设计的"温度 = 实验进度"的科普叙事**真正落到玩家可感知层** —— 否则温度只是数字而已
- 放在 Task 2 之后:阶段相要"覆盖"很多既有规则(spawn / score / combo 窗口),**Task 2 已经把这些规则解耦成可配置**,Task 3 就只需要插入一个 patch 应用器,改动局部
- 点火高潮和阶段化在同一任务:它们共享"阶段切换"基础设施 —— 拆开做反而要重复改 PhaseSystem
- 自维持成功的视觉烟火(200 粒迸射、慢动作)**留给 Task 4**,但数据流(`EV.SELF_SUSTAIN_ACHIEVED` 触发 + 加分 + 切阶段)在本任务完成,因为下游事件订阅者必须先存在

### 5.4 改动范围

#### 代码:事件与状态
- `events.js` 加 `EV.PHASE_CHANGED { from, to }`、`EV.IGNITION_TICK { elapsed }`(可选,逐帧)、`EV.SELF_SUSTAIN_ACHIEVED`
- `world.js` `resetWorld()` 增加:
  - `world.phase = 'IGNITION_PREP'`(字符串,与 `CONFIG.phases.thresholds` 的 key 对齐)
  - `world.ignitionPhase = { active: false, elapsed: 0, entered: false }`
  - `world.selfSustained = false`
  - `world.maxCombo = 0`

#### 代码:阶段系统(新)
- 新建 `systems/phaseSystem.js`:订阅 `EV.TEMP_CHANGED`,根据 `world.temperature` 与 `CONFIG.phases.thresholds` 计算当前阶段;变化时发 `EV.PHASE_CHANGED { from, to }`
- **IGNITION_BURST 是单向门**:进入后即使温度回退到 99 也不退出(由 `ignitionPhase` 接管直到 20 秒结束或玩家死亡)
- 注册到 main.js 系统列表(在 `temperatureSystem` 之后、`difficultySystem` 之前)

#### 代码:把现有系统改造成"读 phase 规则"
所有这些系统在每次 `EV.PHASE_CHANGED` 时拿 `CONFIG.phases.rules[phase]` 一个 patch 对象,缓存生效值:
- `difficultySystem.js`:用 `obstacleSpacingMul` 调整 spawn 间距;`scrollSpeed` 仍走温度档但乘 phase 修饰(若 GDD 未指定阶段对 scroll 的修饰,保持 spawn 间距修饰即可)
- `spawnSystem.js`:`dtSpawnChance` / `tungstenSpawn` / `nbiSpawn` 读 phase 规则
- `particleStreamSystem.js`:`particleRateMul` 读 phase 规则
- `fusionSystem.js`:`comboWindow` 读 phase 规则
- `scoreSystem.js`:所有得分 × `phase.scoreMul`

#### 代码:点火高潮相系统(新)
- 新建 `systems/ignitionPhaseSystem.js`
- 订阅 `EV.PHASE_CHANGED`:`to === 'IGNITION_BURST'` 时启动 20 s 倒计时(进入 enterFreeze 阶段先 0.6 s 冷却由 Task 4 处理慢动作,本任务先正常推进)
- 每秒发 `EV.IGNITION_TICK { elapsed }`(或每帧发也行,HUD 自己节流)
- 5 / 10 / 15 s 里程碑发飘字(走 particleSystem)
- 满 20 s 发 `EV.SELF_SUSTAIN_ACHIEVED`,`world.selfSustained = true`,scoreSystem 加 `selfSustainBonus`,然后 `phaseSystem` 把 phase 切到 RECORD
- 玩家死亡时记录 `ignitionPhase.elapsedAtDeath`,供死亡卡片使用

#### 代码:HUD
- `index.html` 加 `#hud-ignition-bar` 容器(底部居中,默认隐藏)
- `hud.js`:订阅 `EV.PHASE_CHANGED` 进入 IGNITION_BURST 时滑入进度条;`EV.IGNITION_TICK` 更新填充;`EV.SELF_SUSTAIN_ACHIEVED` 爆裂消失;按 GDD §10.6 实现样式
- `hud.js`:订阅 `EV.PHASE_CHANGED` 触发阶段大字飘字(委托 particleSystem)

#### 代码:Particle System 阶段切换 + 自维持飘字
- 阶段切换大字 + 副标题(content.md §7.3,1.8 s,60 px 大字 + 22 px 小字)
- 点火高潮进入大字 `🎉 点火成功!` + 副标题(content.md §7.4.1)
- 5/10/15 s 里程碑小飘字(content.md §7.4.2)
- 自维持成功主标 + 副标 + 注脚(content.md §7.5.1) —— **本任务先用静态字号 + 简单淡入淡出**,逐字延迟入场和径向迸射粒子留 Task 4

#### 代码:Content + Death Card
- `content.js` 加阶段名 / 副标题 / 点火进入 / 自维持等 key(双语)
- `screens.js` 死亡卡片渲染:在 T5/T6 卡片末尾插入 `{ignitionLine}` 三分支(content.md §8.2);占位符要支持 `{maxCombo}` / `{ignitionSeconds}` / `{selfSustained}`(content.md §1.3)
- 死亡时计算并传入 `world.maxCombo` / `world.ignitionPhase.elapsedAtDeath` / `world.selfSustained`

### 5.5 引用文档
- GDD §7.4 / §7.5 / §10.6 / §11(phases.rules / ignitionPhase 全部字段)
- content.md §7.3 / §7.4 / §7.5(主标/副标/动画,本任务实现"文字版",视觉烟火留 Task 4)/ §8.2(死亡卡片 T5/T6 ignitionLine)
- architecture.md §10 扩展点表(新增 PhaseSystem / IgnitionPhaseSystem 的位置)

### 5.6 验收清单
- [ ] 进入 30 / 80 / 100 / 150 M° 时屏幕中央有阶段大字飘字 + 副标题
- [ ] HEATING 阶段才开始出钨;CRITICAL 障碍变密;IGNITION_BURST 钨停生
- [ ] 温度跨到 100,屏幕底部滑入进度条,逐秒推进
- [ ] 高潮相 20 秒内,Combo 窗口明显比平时宽(更容易接连击)
- [ ] 撑满 20 秒,触发自维持飘字 + 加 200 分 + 切到 RECORD 阶段
- [ ] 高潮相内被偏滤器撞死,死亡卡片显示"你在点火持续期撑了 N 秒"
- [ ] 撑满后再死,死亡卡片显示"你撑满了 20 秒 —— 一次自维持燃烧"
- [ ] 死亡卡片 T4+ 显示最高 combo
- [ ] `npm run check:i18n` + `npm run build` 通过

### 5.7 不在本任务范围
- 阶段辉光叠层、点火进入的 0.7 倍速 / 白闪、自维持的 0.4 倍速 + 200 粒迸射、Combo 的屏幕级 fx —— **全部留 Task 4**,本任务只做"文字 + 数据流 + HUD 进度条"

---

## 6. Task 4 — 视觉合成层 + 屏幕级 FX 全套

### 6.1 前因
- Task 1–3 完成后,游戏在功能上是完整的:有阶段、有 combo、有点火、有自维持
- 但视觉上**还是"很素"** —— 背景是纯色 + 几条网格,没有沉浸感;Combo 飘字没有屏幕级反馈,质感不够;点火高潮和自维持没有"仪式感"
- 这一波是把游戏从"功能完整"推到"惊艳"的最后一公里
- 用户在头脑风暴里多次强调"动感、质感"

### 6.2 后果(完成后游戏的状态)
- 背景换成**托卡马克真空室内部视图**(用户提供的 `background_tokamak.png`),配合代码绘制的**阶段辉光叠层**,五个阶段视觉基调完全不同
- Combo ×3+ 飘字伴随屏幕辉光脉冲;×4+ 带震屏;×5+ 带轻微全屏白闪 ——**严格遵守 content.md §7.2.4 的硬上限**(白闪 ≤8% / 震屏 ≤5 px / 5s 内 ≤4 次)
- 进入点火高潮:0.7 倍速慢动作 0.6 s + 0.15 s 白闪
- 自维持成功:0.4 倍速慢动作 + 全屏金光爆裂 + 200 粒径向迸射 + 边缘 vignette 持续 3 秒
- 视差远景磁力线慢速向左滚动,加深"在真空室里"的沉浸感

### 6.3 开发理由
- **视觉是最容易被反复调参的部分**,放在最后做有两个好处:
  1. 数值参数已经全部稳定下来,不会因为后续逻辑调整再返工
  2. 视觉 fx 调一次半天,放在最后做不影响前面任务的验收节奏
- 视觉 fx 高度依赖**事件已经发出来**,Task 3 已经把所有事件流接通,Task 4 是纯订阅
- 这一波**完全不动业务逻辑** —— 只是订阅事件、画好看的画面、按硬约束限制刺激强度。回归风险最低,所以可以放心做"最炫的部分"
- 屏幕级 FX 的硬上限不能违反(光敏 / 家长友好 / 展位环境噪声大但视觉敏感) —— 这条规则放在最后一个任务里,实施者**只有这一次机会**违反它,文档已经把数字钉死

### 6.4 改动范围

#### 代码:背景板与渲染顺序
- `assetLoader.js` 加载 `background_tokamak.png`
- `renderer.js` 改成 GDD §13.1 的渲染顺序:
  1. 背景板(若加载成功;失败用纯色 + 静态磁力线弧兜底)
  2. 阶段辉光叠层(代码 radialGradient)
  3. 视差远景磁力线(把现有 `drawMagneticGrid` 拆出来,慢速向左滚动)
  4. 障碍 / 收集物 / 粒子云 / boost / hazard
  5. 等离子体 + 拖尾
  6. 前景粒子特效(聚变、Combo 飘字、自维持迸射)
  7. HUD overlay(DOM,不在 canvas)

#### 代码:阶段辉光叠层(新)
- 在 renderer 内一个独立 draw 函数,读 `world.phase` 与 `world.phaseGlowLerp`(由 phaseSystem 在切换时启动 0.5 秒 lerp)
- 五档色映射查 `THEME.glow[phase]`(新增到 theme.js)
- 0.6 Hz 呼吸脉动,透明度按 phase 不同(deep 5% → gold 25%)
- IGNITION_BURST 额外叠 vignette 风边缘金色

#### 代码:Combo 屏幕级 FX
- 在 `renderer.js` 加一个事件订阅层(或独立 `screenFxSystem.js`,**推荐独立**避免 Renderer 持有事件订阅破坏架构)
- 订阅 `EV.FUSION_TRIGGERED { combo }`:
  - combo=1:无屏幕级 fx
  - combo=2:四角金色辉光 0.15 s 淡入 / 0.3 s 淡出
  - combo=3:同 ×2 + 全屏 radialGradient 金光脉冲 1 次
  - combo=4:同 ×3 + 0.10 s 横向震屏(amplitude 3 px,decay)
  - combo≥5:同 ×4 + **单帧 0.05 s 全屏白闪 ≤8% alpha** + 震屏 0.20 s + 金色 vignette
- 5 s 内闪烁累计 > 4 次时,**强制吞掉本次白闪**(只保留辉光)
- 全部数值从 `CONFIG.combo.screenFx` 读

#### 代码:点火高潮进入烟火
- 新建一个时间轴动画(可以用简单的 state object 加 dt 推进)
- 0.0 s:开始 0.7 倍速,触发(让 gameLoop 把 dt × 0.7 喂给所有 system)—— **慢动作只影响游戏内时间,UI 动画用真实时间**
- 0.0–0.15 s:白色叠层 alpha 0 → 0.35
- 0.15–0.60 s:白叠层 alpha 0.35 → 0,金色 radial alpha 0 → 0.25
- 0.60 s:恢复正常速度,进入稳态金光叠层(已由阶段辉光层负责)

#### 代码:自维持成功烟火
- 触发 `EV.SELF_SUSTAIN_ACHIEVED`:
  - 0.4 倍速持续 0.5 s
  - 全屏金光 radial alpha 0 → 0.6 → 0.2(0.4 s)
  - 200 粒粒子从画布中心径向迸射(初速 200–400 px/s,衰减 + 重力,3 秒消失)
  - 屏幕边缘金色 vignette 持续 3 秒后渐隐
- 配合 Task 3 已经在的"自维持成功!"飘字升级:加**逐字延迟入场**(每字延迟 30 ms,内容来自 content.md §7.5.2)

#### 代码:细节升级
- 阶段切换大字加 §7.3.2 的入场过冲(本来 Task 3 已经实现,这里 review 一下)
- 视差远景磁力线:在背景板上方画 3–5 条 SVG 风弧线,慢速向左滚动(15 px/s),透明度 30%

#### 代码:`screenFxSystem.js` 与 gameLoop 接口
- 新建该系统注册到 main.js,在 `cleanup` 之后、`renderer` 之前
- `gameLoop` 可能需要小改造:暴露一个 `setTimeScale(scale)` 让 IgnitionPhase / SelfSustain 控制慢动作。或者直接让 gameLoop 调用一个 `world.timeScale` 字段(更解耦)

### 6.5 引用文档
- GDD §13.1(背景板 + 阶段辉光层 + 渲染顺序)、§7.5.2 / §7.5.3 / §7.5.4(点火高潮进入 / 持续 / 自维持视觉)
- content.md §7.2.4(combo 屏幕级 fx 硬约束)、§7.4.4(点火进入闪光)、§7.5.3(自维持画面级反馈)
- assets.md 协作约定(关键!**所有动态效果都是代码**,不要回头让美术补素材)

### 6.6 验收清单
- [ ] 启动游戏后能看到托卡马克背景板(不是黑底 + 网格)
- [ ] 阶段切换时背景辉光颜色 0.5 s 内 lerp 到新基调,且有低频呼吸脉动
- [ ] Combo ×3 时屏幕能看到一次金光脉冲;×5 时有轻微震屏 + 白闪,**但不刺眼**
- [ ] 5 秒内多次 ×5 combo,白闪自动被限频(只闪 4 次)
- [ ] 跨越温度 100,屏幕短暂变慢 + 白闪一次,然后进入持续金光
- [ ] 撑满高潮 20 s,屏幕慢动作 + 大量金色粒子从中心迸射,持续 3 秒
- [ ] 背景板 PNG 删掉,游戏不崩,退回纯色 + 静态磁力线
- [ ] 在展位机型上跑 60 FPS 不掉帧(实测!)
- [ ] 找一位光敏敏感的同事看一遍,确认不刺眼

### 6.7 不在本任务范围
- 任何新业务逻辑、新元素、新文案 —— 都属于设计层改动,需要先改文档
- 音效(GDD §14 二期增强,不在 MVP)
- 高分本地存储(GDD §14 二期)
- 屏幕震动死亡瞬间(GDD §14 二期)

---

## 7. 跨任务的反复检查项

每个任务完成时,coder 都要过一遍这份"防退化清单":

- [ ] `npm run check:i18n` 通过(无硬编码中日文字)
- [ ] `npm run build` 通过
- [ ] 关掉任意一张 PNG 启动,游戏不崩,占位逻辑工作
- [ ] **不破坏前序任务的验收清单**(比如 Task 3 完成时,Task 1 / Task 2 的验收项都要重测一次,不能因为新加的 PhaseSystem 把 Combo 弄坏)
- [ ] config 数值与 GDD §11 完全一致(任何偏差都要先改 GDD)
- [ ] 文案与 content.md 完全一致(双语同步)

---

## 8. 时间预估(参考,非承诺)

| 任务 | 预估 | 风险点 |
|---|---|---|
| Task 1 | 1.5 – 2 天 | 视觉化燃料舱的 CSS / DOM 联调容易反复 |
| Task 2 | 1.5 – 2 天 | Combo 飘字的动画时间轴需要手动调到舒服 |
| Task 3 | 2 – 3 天 | PhaseSystem 改造涉及多个既有系统,容易引入回归 |
| Task 4 | 2 – 3 天 | 屏幕级 fx 调参反复,慢动作要小心不破坏物理 |
| **合计** | **7 – 10 天** | — |

每个任务完成后**人工本地跑一局**做验收,不通过就不开下一个任务。

---

## 9. 关键禁区

- ❌ **不要在任何任务里"顺手"实现其他任务的内容** —— 范围蔓延是 AI coding 最大的退化来源
- ❌ **不要让 Combo 的屏幕级 fx 在 Task 2 提前实现**(就算 Task 2 看起来很容易顺手做)—— 那是 Task 4 的事,要严格按 content.md §7.2.4 上限做
- ❌ **不要为了让代码漂亮重构既有架构** —— 文档定下来的架构(architecture.md)就是权威,只在扩展点动手
- ❌ **不要绕过 EventBus 让两个 System 直接对话**(比如让 spawnSystem 直接 import phaseSystem)
- ❌ **不要在素材规范化之前开始 Task 1** —— assetLoader 依赖规范文件名

---

## 10. 当前状态(本文件维护)

> 每次完成一个 Task,**直接在本文件标记完成日期**,作为简易的进度日志。

- [x] Task 1 — 基础校准 + 素材接入 + 第一波元素 — _2026-05-12 完成_
- [x] Task 2 — 粒子云 + Combo + 高潮窗 — _2026-05-12 完成_
- [x] Task 3 — 阶段相 + 点火高潮 + 自维持 — _2026-05-12 完成_
- [ ] Task 4 — 视觉合成层 + 屏幕级 FX — _未开始_
