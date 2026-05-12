# 核聚变 Flappy 科普小游戏

校园开放日展位用的核聚变科普 Flappy 风格小游戏。

## 文件位置

- `docs/architecture.md` — 代码组织规范(四层架构 / SOLID / DRY)
- `docs/game-design.md` — 玩法、数值、流程
- `docs/content.md` — 玩家可见的所有文案
- `src/` — 游戏源码(权威实现,按架构文档组织)
- `package.json` / `vite.config.js` — Vite 开发服务器与打包配置
- `scripts/check-i18n.mjs` — 中日双语文案完整性校验

## 运行

⚠️ **不要直接双击 `src/index.html`**。游戏用了浏览器原生 ES Modules,`file://` 协议下模块 import 和资源加载不可靠。统一通过 Vite 的本地开发服务器运行。

### 一键启动(推荐)
**双击项目根目录的 `start.bat`**。它会:
1. 首次运行时自动执行 `npm install`
2. 启动 Vite 开发服务器
3. 自动打开浏览器到本地地址(默认 `http://localhost:8000/`,端口被占用时 Vite 会换下一个可用端口)
4. 关掉黑窗口就停服务器

需要 Node.js。推荐使用当前 LTS 或更新版本。

### 手动启动
```powershell
cd D:\1_Projects\99_Playground\30_miniGames\openCampus
npm install
npm run dev
```
Vite 会自动打开浏览器;也可以手动打开终端里显示的本地地址。

## 多语言

游戏支持中文 / 日语,初始默认日语。画面右下角的圆形“语”按钮可一键切换语言,也可以用 URL 参数指定:

```text
http://localhost:8000/?lang=ja
http://localhost:8000/?lang=zh
```

新增任何玩家可见文字时,必须在 `src/content.js` 同时补齐 `zh` 和 `ja`。`npm run build` 会先执行 `npm run check:i18n`,缺任意语言或在 `src/content.js` 外硬编码中日文字都会失败。

### 打包与预览
```powershell
npm run build
npm run preview
```

`npm run build` 会生成 `dist/`。`dist/` 是静态产物,可以部署到任意静态服务器;本地验收用 `npm run preview`,不要直接双击 `dist/index.html`。

## 操作

| 状态 | 按键 | 行为 |
|---|---|---|
| 菜单 | 空格 | 开始游戏 |
| 游戏中 | 空格 | 触发磁场脉冲 |
| 死亡 | 空格 | 重新开始 |
| 死亡 | 鼠标点击"了解更多" | 打开科普 modal |

## 调参

所有数值在 `src/config.js` 集中管理。改完后重载浏览器即可。
设计依据在 `docs/game-design.md` §11,改前先确认是否需要同步该文档。

## 展位部署

笔记本上预先运行 `npm run dev` 或 `npm run preview`,用 Chrome / Edge 打开 Vite 给出的本地地址并锁定全屏。建议禁用屏保和系统更新提示。
