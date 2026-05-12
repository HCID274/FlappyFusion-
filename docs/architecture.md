# 技术架构文档 — 核聚变 Flappy 科普小游戏

> 本文档是代码组织的唯一权威来源。AI 写代码时应先读本文档,任何偏离需先修文档再改代码。
> 配套文档:`game-design.md`(玩什么) / `content.md`(说什么文案)。

---

## 1. 设计目标与硬约束

| 维度 | 约束 |
|---|---|
| 开发/部署 | 使用 Vite 启动本地开发服务器、打包 `dist/` 静态产物;禁止依赖 file:// 直开 |
| 画布 | 800×600 Canvas,固定尺寸 |
| 输入 | 仅键盘空格键 |
| 单局时长 | 60–90 秒 |
| 浏览器 | 现代 Chrome/Edge,通过 Vite/静态服务器加载 ES Modules |
| 性能 | 稳定 60 FPS,展位机型一般是普通笔记本 |

工程目标:**用最少的抽象,把"会变化的部分"和"不会变化的部分"分开**。SOLID/DRY 不是为了好看,是为了让 AI coding 在多次迭代下不退化。

---

## 2. 架构总览

四层结构,自上而下,**只允许上层依赖下层**:

```
┌──────────────────────────────────────────────────┐
│ Presentation 表现层                               │
│   Renderer · HUD · Screens                       │
├──────────────────────────────────────────────────┤
│ Application 应用层                                │
│   GameLoop · StateMachine · SystemScheduler      │
├──────────────────────────────────────────────────┤
│ Domain 领域层                                     │
│   Entities (Plasma/Obstacle/Collectible)         │
│   Systems  (Physics/Collision/Score/Temp/...)    │
├──────────────────────────────────────────────────┤
│ Infrastructure 基础设施层                         │
│   EventBus · Config · Content · Theme · Input    │
└──────────────────────────────────────────────────┘
```

跨层通信只有两种合法形式:
1. 下层的接口被上层调用
2. 任意层通过 `EventBus` 发/收事件

---

## 3. 设计原则的具体落地

### 3.1 高内聚

每个模块只解决一类问题。反例(禁止):`GameSystem` 一个文件里管物理、分数、碰撞。

正例:`TemperatureSystem` 只决定"温度数值是多少、何时跨越阈值",不管"温度变高后场景滚得多快"——后者属于 `DifficultySystem` 的职责,通过订阅 `temperature:changed` 事件得知温度变化。

### 3.2 低耦合

- **跨模块通信走 `EventBus`**,模块之间不直接持有彼此引用
- **唯一例外**:`Renderer` 直接读 `Entity` 状态(性能考虑,且严格只读)
- **配置/文案/主题是叶子节点**,任何模块可读,但它们不依赖任何业务模块

### 3.3 SOLID

| 原则 | 在本项目的体现 |
|---|---|
| **S** Single Responsibility | 每个 System 只订阅它关心的事件、只输出它负责的状态 |
| **O** Open/Closed | `Obstacle`、`Collectible` 是接口;新增类型只加文件不改框架 |
| **L** Liskov | 所有 `Obstacle` 实现必须能被 `CollisionSystem` 同样处理(暴露相同的 `hitBoxes`) |
| **I** Interface Segregation | 区分 `Updatable` / `Renderable` / `Collidable`,不强求所有 Entity 都全实现 |
| **D** Dependency Inversion | `CollisionSystem` 接收 `Collidable[]`,不接收具体的 `Divertor[]` |

### 3.4 DRY

| 类别 | 唯一来源 |
|---|---|
| 数值参数(重力、推力、间距、温度阈值、得分) | `config.js` |
| 对玩家可见的文案 | `content.js` 双语 catalog,通过 `i18n.js` 读取 |
| 视觉常量(颜色、字号、尺寸) | `theme.js` |
| 事件名字符串 | `engine/events.js` 导出常量,禁止裸字符串 |

业务代码里出现的任何数字、文案、颜色、事件名,**都必须从上述四个文件来**。这是 AI coding 最容易破坏 DRY 的地方,需要在 review 时严格执行。

---

## 4. 模块划分与职责

### 4.1 Engine 引擎层

| 模块 | 职责 | 不该做的事 |
|---|---|---|
| `gameLoop.js` | 用 `requestAnimationFrame` 驱动主循环,固定时间步累加 | 不知道 Entity / System 的具体类型 |
| `stateMachine.js` | 顶层状态:`menu` / `playing` / `dead`。状态切换走事件 | 不操作 Entity |
| `eventBus.js` | `on/off/emit`,简单的发布订阅 | 不缓存事件历史 |
| `events.js` | 事件名常量(`EV.PLASMA_DEAD`、`EV.FUSION_TRIGGERED`、`EV.HAZARD_HIT`、`EV.BOOST_TRIGGERED` 等) | — |

### 4.2 Domain — Entities

实体只持有自己的状态,不知道分数、温度、其他实体的存在。**按"碰撞后果"划分四个子目录**:

| 子目录 | 语义 | 模块 |
|---|---|---|
| `obstacles/` | 致死障碍 | `divertor.js` 偏滤器(主线"水管")、`instability.js` MHD 不稳定区(扭曲红云) |
| `hazards/` | 软障碍(撞到不死,负面效果) | `tungsten.js` 钨碎片(温度倒退 1 档 + 红闪) |
| `collectibles/` | 拾取物(撞到正面效果) | `deuterium.js` D(蓝)、`tritium.js` T(绿)、`lithium6.js` ⁶Li(紫银,自动 +1 T)、`hModeRing.js` H 模光环(可选) |
| `boosts/` | 大尺寸加成通道(穿过获益) | `nbi.js` NBI 中性束加热(温度 +1 档 + 金光) |
| (顶层) | 玩家 | `plasma.js`(`pos / vel / alive / trail / pulseCooldown`) |

**接口契约**(JSDoc 描述,duck typing):

```js
// 致死障碍
Obstacle = {
  id, type: 'divertor' | 'instability',
  x, hitBoxes: AABB[], passed: boolean,
  render(ctx)
}

// 软障碍(碰撞后惩罚但不死)
Hazard = {
  id, type: 'tungsten',
  pos: Vec2, hitBox: AABB, triggered: boolean,
  render(ctx)
}

// 拾取物
Collectible = {
  id, type: 'D' | 'T' | 'Li6' | 'HMode',
  pos: Vec2, hitBox: AABB, collected: boolean,
  render(ctx)
}

// 加成通道(覆盖大区域,穿过即触发)
Boost = {
  id, type: 'nbi',
  pos: Vec2, hitBox: AABB, triggered: boolean,
  render(ctx)
}
```

**事件分发**(CollisionSystem 根据命中实体类型派发):
- 命中 Obstacle → `EV.PLASMA_DEAD`
- 命中 Hazard → `EV.HAZARD_HIT { type, x, y }`(TempSystem 订阅,扣温度)
- 命中 Collectible → `EV.COLLECTIBLE_HIT { type, x, y }`(ScoreSystem / FusionSystem 订阅)
- 命中自由电子粒子 → `EV.PARTICLE_COLLECTED { x, y }`(ScoreSystem / ParticleSystem 订阅,+1 小飞字)
- 命中 Boost → `EV.BOOST_TRIGGERED { type, x, y }`(TempSystem 订阅,加温度)

### 4.3 Domain — Systems

每个 System 是一个无状态(或弱状态)的对象,暴露 `update(dt, world)` 方法。

| 模块 | 输入(订阅 / 读) | 输出(写 / 发) |
|---|---|---|
| `inputSystem.js` | 浏览器键盘事件 | 发 `EV.INPUT_PULSE` |
| `physicsSystem.js` | `EV.INPUT_PULSE`、`world.scrollSpeed` | 改 Plasma 速度、推进所有滚动实体 x |
| `collisionSystem.js` | Plasma + 所有 Collidable | 发 `EV.PLASMA_DEAD` / `EV.COLLECTIBLE_HIT` / `EV.PARTICLE_COLLECTED` / `EV.HAZARD_HIT` / `EV.BOOST_TRIGGERED` |
| `spawnSystem.js` | `world.scrollSpeed`、节奏计时 | 向 world 添加新 Obstacle / Hazard / Collectible / Boost(主线掷骰 + 额外掷骰独立处理) |
| `particleStreamSystem.js` | `world.fusionBurst.active`、`EV.PHASE_CHANGED`、独立计时 | 向 `world.particleStream` 添加自由电子粒子串 |
| `scoreSystem.js` | `EV.OBSTACLE_PASSED`、`EV.COLLECTIBLE_HIT`、`EV.PARTICLE_COLLECTED`、`EV.FUSION_TRIGGERED`、`EV.SELF_SUSTAIN_ACHIEVED`、`EV.PHASE_CHANGED` | `world.score`、发 `EV.SCORE_CHANGED` |
| `temperatureSystem.js` | `EV.OBSTACLE_PASSED`、`EV.HAZARD_HIT`(扣)、`EV.BOOST_TRIGGERED`(加) | `world.temperature`、发 `EV.TEMP_CHANGED` / `EV.TEMP_MILESTONE` |
| `phaseSystem.js` | `EV.TEMP_CHANGED`、`EV.SELF_SUSTAIN_ACHIEVED` | 维护 `world.phase`,发 `EV.PHASE_CHANGED` |
| `ignitionPhaseSystem.js` | `EV.PHASE_CHANGED`、`EV.PLASMA_DEAD` | 维护 20 秒点火持续期,发 `EV.IGNITION_TICK` / `EV.SELF_SUSTAIN_ACHIEVED` |
| `difficultySystem.js` | `EV.TEMP_CHANGED` | `world.scrollSpeed`、SpawnSystem 间距 |
| `fusionSystem.js` | `EV.COLLECTIBLE_HIT` (D/T/Li6;Li6 视作"自动 +1 T")、`EV.PHASE_CHANGED` | 维护 `collectedD/T` / `world.combo` / `world.fusionBurst`,发 `EV.COMBO_INCREMENT` / `EV.FUSION_TRIGGERED` |
| `particleSystem.js` | `EV.FUSION_TRIGGERED`、`EV.COMBO_INCREMENT`、`EV.PARTICLE_COLLECTED`、`EV.PHASE_CHANGED`、`EV.IGNITION_TICK`、`EV.SELF_SUSTAIN_ACHIEVED` 等 | 维护粒子与飘字生命周期 |
| `cleanupSystem.js` | 所有滚动实体 | 移除离屏对象 |

### 4.4 Presentation

| 模块 | 职责 |
|---|---|
| `renderer.js` | 按 z-order 把所有 `Renderable` 画到 Canvas:背景 → 障碍 → 粒子云 → 收集物 → 等离子体 → 飘字/粒子 → 调试层 |
| `hud.js` | DOM 元素显示温度/得分/磁场环/燃料舱/Combo 圆环/点火持续条。订阅事件更新离散状态,每帧只刷新时间与倒计时 |
| `screens.js` | `MenuScreen` / `DeathCardScreen` / `TutorialScreen`,DOM overlay |

### 4.5 Infrastructure

| 模块 | 职责 |
|---|---|
| `config.js` | 所有可调数值常量,见 §8 |
| `content.js` | 中文/日语文案 catalog 与查询函数:`t(key)` / `getMilestoneText(temp)` / `getDeathBody(...)` |
| `i18n.js` | 语言选择(默认日语)、catalog 结构校验、缺 key 抛错、语言切换事件 |
| `theme.js` | 颜色、字号、尺寸 |
| `assetLoader.js` | 启动时预加载当前 gameplay / HUD 必需 PNG(规格见 `docs/assets.md`)。背景板等屏幕级素材由对应任务注册或延迟加载。暴露 `getImage(key)` 给 entity / HUD 用。**缺图回退**:返回 `null`,Entity 在 render 时检测到则改用纯色色块绘制 — 这样部分图缺失也能跑通游戏 |

---

## 5. 模块依赖关系图

```
                        ┌──────────────┐
                        │  EventBus    │ ◄──── 所有 System / HUD / Screens 订阅
                        └──────┬───────┘
                               ▲
                               │ emit
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────┴─────┐          ┌─────┴────┐           ┌─────┴────┐
   │ Systems  │ ── update ──► World │ ◄── read ─│ Renderer │
   └────┬─────┘          │ (Entities)│           └──────────┘
        │                └──────────┘
        ▼
   ┌──────────┐
   │  Config  │  ◄── 任何模块只读
   │  Content │
   │  Theme   │
   └──────────┘
```

**禁止**:
- Entity 引用 System
- System 直接调用其他 System 的方法(必须通过 EventBus)
- Renderer 修改 Entity 状态
- Config / Content / Theme 反向依赖业务

---

## 6. 核心数据结构

```js
// 用 JSDoc 描述,运行时是普通对象。需要时可换成 class。

/** @typedef {{x:number, y:number}} Vec2 */
/** @typedef {{x:number, y:number, w:number, h:number}} AABB */

/** @typedef {{
 *   pos: Vec2,
 *   vel: Vec2,
 *   alive: boolean,
 *   trail: Vec2[],
 *   pulseCooldown: number,
 * }} Plasma */

/** @typedef {{
 *   id: string,
 *   type: 'divertor' | 'instability',
 *   x: number,
 *   hitBoxes: AABB[],
 *   passed: boolean,
 * }} Obstacle */

/** @typedef {{
 *   id: string,
 *   type: 'tungsten',
 *   pos: Vec2,
 *   hitBox: AABB,
 *   triggered: boolean,
 * }} Hazard */

/** @typedef {{
 *   id: string,
 *   type: 'D' | 'T' | 'Li6' | 'HMode',
 *   pos: Vec2,
 *   hitBox: AABB,
 *   collected: boolean,
 * }} Collectible */

/** @typedef {{
 *   id: string,
 *   type: 'nbi',
 *   pos: Vec2,
 *   hitBox: AABB,
 *   triggered: boolean,
 * }} Boost */

/** @typedef {{
 *   id: string,
 *   type: 'particle',
 *   pos: Vec2,
 *   hitBox: AABB,
 *   collected: boolean,
 * }} ParticleStreamItem */

/** @typedef {{
 *   status: 'menu' | 'playing' | 'dead',
 *   elapsed: number,
 *   score: number,
 *   temperature: number,        // 单位:百万度(M°),HUD 显示时格式化
 *   scrollSpeed: number,
 *   obstaclesPassed: number,
 *   fusionCount: number,
 *   phase: 'IGNITION_PREP' | 'HEATING' | 'CRITICAL' | 'IGNITION_BURST' | 'RECORD',
 *   combo: { count: number, lastTime: number, window: number },
 *   fusionBurst: { active: boolean, remaining: number },
 *   ignitionPhase: { active: boolean, elapsed: number, entered: boolean, elapsedAtDeath: number },
 *   selfSustained: boolean,
 *   collectedD: number,         // 当前 D 库存,无逻辑硬上限
 *   collectedT: number,         // 当前 T 库存,无逻辑硬上限
 *   plasma: Plasma,
 *   obstacles: Obstacle[],
 *   hazards: Hazard[],
 *   collectibles: Collectible[],
 *   particleStream: ParticleStreamItem[],
 *   boosts: Boost[],
 *   particles: Particle[],
 *   inputBlocked: boolean,      // modal 打开时 set true,inputSystem 检查
 * }} World */
```

`World` 是唯一的可变状态容器。Systems 在每帧 `update(dt, world)` 中读写它,Renderer 只读它。

---

## 7. 状态机与帧循环

### 7.1 顶层状态机

```
        space
[Menu] ──────► [Playing] ─── plasma_dead ───► [Dead]
   ▲                                            │
   └──────────────── space ─────────────────────┘
```

每个状态有 `enter / update / exit` 钩子。`Playing.enter()` 重置 `World`,`Dead.enter()` 停止物理与生成、显示死亡卡片。

### 7.2 帧循环

固定时间步,`dt = 1/60`,每帧最多追赶 5 步避免长卡顿后的"死亡螺旋"。

每帧 System 执行顺序(硬编码,不通过事件决定):

```
1. inputSystem       (将本帧按键 flush 成事件)
2. spawnSystem       (生成新实体)
3. particleStreamSystem (生成自由电子粒子串)
4. physicsSystem     (移动)
5. collisionSystem   (检测,可能触发 plasma_dead)
6. fusionSystem      (D+T 配对、combo、聚变高潮窗)
7. scoreSystem       (累加得分)
8. temperatureSystem (温度推进)
9. phaseSystem       (温度阶段相)
10. ignitionPhaseSystem (点火持续期)
11. difficultySystem  (调速)
12. particleSystem   (特效寿命)
13. cleanupSystem    (移除离屏)
14. renderer         (绘制)
```

顺序 rationale:输入要先于物理;碰撞要在物理后、聚变前;难度要在温度后;清理要在所有逻辑后、渲染前。

---

## 8. 配置(DRY 的核心)

`config.js` 的**结构**由本文档定义,**具体数值**的权威来源是 `game-design.md` §11。架构文档只规定:

- 所有可调参数集中在单个 `CONFIG` 对象
- 按领域分组(canvas / plasma / obstacle / scroll / temperature / score / fusion / collectible)
- 单位在注释中明确(如 `// px/s²`、`// 单位:百万度`)
- World 里 `temperature` 字段单位与 config 一致(**百万度 / M°**),HUD 显示时格式化为"1000 万度 / 1 亿度"

**绝不允许**在业务代码里写魔法数字。AI review 时这是头号检查项。调参时:先改 GDD §11,再同步到 config.js,最后跑游戏验证。

---

## 9. 文件结构

```
openCampus/
├── docs/
│   ├── architecture.md      ← 本文档
│   ├── game-design.md
│   ├── content.md
│   └── assets.md            ← 美术素材规范
├── package.json             npm scripts: dev / build / preview
├── vite.config.js           Vite root=src,outDir=dist,本地端口默认 8000
├── src/
│   ├── assets/              ← AI 生成 + PS 抠图的透明 PNG
│   │   ├── atom_d.png
│   │   ├── atom_t.png
│   │   ├── atom_li6.png
│   │   ├── hazard_tungsten.png
│   │   ├── boost_nbi.png
│   │   └── hud_he4.png      (可选)
│   ├── index.html
│   ├── main.js              入口,组装所有模块
│   ├── engine/
│   │   ├── gameLoop.js
│   │   ├── stateMachine.js
│   │   ├── eventBus.js
│   │   └── events.js
│   ├── entities/
│   │   ├── plasma.js
│   │   ├── obstacles/       致死
│   │   │   ├── divertor.js
│   │   │   └── instability.js
│   │   ├── hazards/         软障碍
│   │   │   └── tungsten.js
│   │   ├── collectibles/    拾取
│   │   │   ├── atomBase.js  (D/T/Li6 共享的原子图标渲染)
│   │   │   ├── deuterium.js
│   │   │   ├── tritium.js
│   │   │   ├── lithium6.js
│   │   │   └── hModeRing.js (可选)
│   │   └── boosts/          加成通道
│   │       └── nbi.js
│   ├── systems/
│   │   ├── inputSystem.js
│   │   ├── physicsSystem.js
│   │   ├── collisionSystem.js
│   │   ├── spawnSystem.js
│   │   ├── scoreSystem.js
│   │   ├── temperatureSystem.js
│   │   ├── difficultySystem.js
│   │   ├── fusionSystem.js
│   │   ├── particleSystem.js
│   │   └── cleanupSystem.js
│   ├── presentation/
│   │   ├── renderer.js
│   │   ├── hud.js
│   │   └── screens.js
│   ├── assetLoader.js       sprite 预加载,缺图占位
│   ├── config.js
│   ├── content.js           中日双语文案 catalog
│   ├── i18n.js              双语读取与校验接口
│   ├── theme.js
│   └── world.js             createWorld / resetWorld
├── scripts/
│   └── check-i18n.mjs       build 前校验双语完整性和硬编码 CJK
├── start.bat                双击启动:安装依赖 + 跑 npm run dev
├── dist/                    npm run build 产物(不进 git)
├── .gitignore
└── README.md
```

开发:运行 `npm run dev`,由 Vite 以 `src/` 为项目根目录提供本地服务器。不要直接双击 `src/index.html`,因为 `file://` 下 ES Module import 和资源加载不可靠。

打包:运行 `npm run build`,产物输出到 `dist/`。本地验收用 `npm run preview`;正式部署时把 `dist/` 放到任意静态服务器。

---

## 10. 扩展点

明确列出最可能变化的地方,变化只动这些位置:

| 变化 | 修改位置 |
|---|---|
| 新致死障碍 | 加 `entities/obstacles/X.js`,在 `spawnSystem` 注册类型与权重 |
| 新软障碍(惩罚不致死) | 加 `entities/hazards/X.js`,在 `spawnSystem` 加额外掷骰、`temperatureSystem` 订阅 `EV.HAZARD_HIT` |
| 新收集物 | 加 `entities/collectibles/X.js`,在 `fusionSystem`/`scoreSystem` 注册行为 |
| 新轻量分数粒子 | 扩展 `particleStreamSystem.js`,在 `collisionSystem` 派发独立事件,不要复用燃料舱收集事件 |
| 新加成通道 | 加 `entities/boosts/X.js`,在 `spawnSystem` 加额外掷骰、相关 System 订阅 `EV.BOOST_TRIGGERED` |
| 新美术素材 | 在 `docs/assets.md` 加规格,在 `assetLoader.js` 注册 key,缺图自动占位 |
| 调难度曲线 | 只改 `config.js`(权威来源是 `game-design.md` §11) |
| 新温度阶段规则 | 改 `config.js` 的 `phases.rules`,由 `phaseSystem` 发事件、各 System 缓存 patch |
| 新点火持续期反馈 | 订阅 `EV.IGNITION_TICK` / `EV.SELF_SUSTAIN_ACHIEVED`,不要让 HUD 直接驱动游戏状态 |
| 改文案 | 只改 `content.js` 的 `zh`/`ja` 双语 catalog(权威来源是 `content.md`) |
| 新玩家可见文字 | 必须同时添加 `zh` 与 `ja` 两份;业务代码只能通过 `t()` 或内容函数读取 |
| 换视觉风格 | 只改 `theme.js`(必要时改 Renderer 内部细节) |
| 新事件 | 在 `events.js` 加常量 |

---

## 11. 不在本文档范围

- 玩法平衡、数值表、关卡节奏 → `game-design.md`
- 飘字台词、死亡卡片文字、二维码 → `content.md`
- 美术资源清单 → 暂不需要(纯几何 Canvas)
- 单元测试 → 不做(展位小游戏 ROI 太低)
- 多语言 → 支持中文 / 日语,默认日语,右下角单按钮切换,禁止新增未校验语言
- 移动端适配 → 不做

---

## 12. AI Coding 守则(给后续会话)

1. **改代码前先读本文档**,任何架构性偏离需先更新文档
2. **数字、文案、颜色、事件名一律不得硬编码**,从 config/content/theme/events 取
3. **新增类型走扩展点**(§10),不要修改框架代码
4. **System 之间不直接调用**,通过 EventBus
5. **Renderer 是只读的**,绝不修改 World
6. **每个新模块只做一件事**,如果要写超过一类职责,拆文件
7. **玩家可见文字必须双语完整**,`npm run build` 会先执行 `npm run check:i18n`;缺中文/日语、或在 `src/content.js` 外硬编码中日文字,都必须失败
