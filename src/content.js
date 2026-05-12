// Single source of truth for all player-facing strings.
// See docs/content.md for design rationale.

export const ui = {
  title: '磁约束生存挑战',
  subtitle: '— Tokamak Plasma Confinement —',
  lab: '糟谷研究室 · 校园开放日',
  startHint: '按 [空格] 开始',
  restartHint: '按 [空格] 再来一次',
  btnRestart: '再来一次',
  btnLearnMore: '了解更多 ↗',
  btnClose: '关闭',
  btnNext: '下一页 →',
  btnPrev: '← 上一页',
};

export const tutorial = '按 [空格] 触发磁场脉冲,把等离子体悬浮在腔室中央。\n撞上炉壁或偏滤器 = 实验失败。\n吃 D + T 触发聚变反应。';

export const hud = {
  temperature: t => `🌡 ${formatTemperature(t)}`,
  inventory: (d, t) => `D:${d}  T:${t}`,
  score: s => `★ ${s}`,
  time: sec => `⏱ ${Math.floor(sec)} s`,
};

export const particleLabels = {
  he4: 'He⁴',
  neutron: 'n',
};

const MILESTONES = {
  50: '已超过太阳核心温度',
  80: '接近劳森判据下限',
  100: '达到聚变点火温度!',
  150: '超越 ITER 设计参数',
  200: '已突破现役实验最高纪录',
};

const DEATH_TITLES = {
  wall: '等离子体接触炉壁',
  divertor: '偏滤器板汽化',
  instability: 'MHD 不稳定性失控',
};

const ITER_FOOTER = 'ITER 用 13 T 的超导磁场约束 1.5 亿度等离子体,目标维持 400 秒以上的聚变反应。';

const INSTABILITY_NAMES = ['撕裂模', '气球模', '锯齿模'];

export const learnMore = [
  {
    heading: '为什么我们要做聚变?',
    body: '1 g 氘氚燃料  ≈  8 吨石油  ≈  11 吨煤\n\n几乎不产生温室气体,\n原料从海水里就能提取。',
  },
  {
    heading: '难在哪',
    body: '难点不是"加热到 1 亿度",\n而是"让 1 亿度的东西不接触任何容器"。\n\n任何固体一接触就立刻汽化、污染等离子体。\n唯一可行的办法:用强磁场"悬浮"住它。\n\nITER 的超导磁体重 1 万吨,\n能产生 13 T 的磁场——是地球磁场的 26 万倍。',
  },
  {
    heading: '我们在做什么',
    body: '糟谷研究室 — 磁约束聚变方向\n\n[研究室二维码占位]\n\n谢谢来玩!',
  },
];

export function formatTemperature(M) {
  if (M < 100) return `${M * 10} 万度`;
  const yi = M / 100;
  return Number.isInteger(yi) ? `${yi} 亿度` : `${yi.toFixed(1)} 亿度`;
}

export function getMilestoneText(temp) {
  return MILESTONES[temp] || null;
}

export function getDeathTitle(cause) {
  return DEATH_TITLES[cause] || DEATH_TITLES.wall;
}

export function getDeathBody({ seconds, fusionCount, maxTemp }) {
  const tempStr = formatTemperature(maxTemp);
  let body, useFooter = true;

  if (maxTemp < 30) {
    body = '等离子体非常脆弱——哪怕是最初的 1000 万度,\n也已经把任何固体材料瞬间汽化。\n这就是为什么我们需要磁场把它"悬空"住,\n让它一刻都不接触炉壁。';
  } else if (maxTemp < 50) {
    body = `不错的开局!你已经把等离子体加热到了 ${tempStr}。\n作为参考:太阳核心约 1500 万度,\n你已经远远超过它了——只是比起聚变反应需要的温度\n还差一些。`;
  } else if (maxTemp < 80) {
    body = `${tempStr} —— 你已经超过太阳核心了。\n但要让氘氚发生足够多的聚变反应,\n人类需要的是太阳核心 5–10 倍的温度。\n原因很简单:地球上没有太阳那样的引力压力,\n我们只能靠"更高温度"来弥补。`;
  } else if (maxTemp < 100) {
    body = `${tempStr} —— 你触到了"劳森判据"的门口。\n这是工程上判断聚变能否净产能的指标:\n温度、密度、约束时间三者乘积要够大。\n你已经搞定了温度,真实的 ITER 还得搞定后两个。`;
  } else if (maxTemp < 150) {
    body = `🎉 ${tempStr} —— 你点火了!\n\n聚变点火温度是 1 亿度。这是地球上人为创造的\n最极端环境之一。\n你坚持了 ${seconds} 秒、完成了 ${fusionCount} 次聚变。\n现实中 ITER 的目标是稳定维持 400 秒以上。`;
    useFooter = false;
  } else {
    body = `${tempStr} —— 已经超越 ITER 的设计参数了。\n你大概是研究室的人,或者天赋异禀。\n我们办公室在 3 楼,欢迎来聊。`;
    useFooter = false;
  }

  return { body, footer: useFooter ? ITER_FOOTER : null };
}

export function pickInstabilityName() {
  return INSTABILITY_NAMES[Math.floor(Math.random() * INSTABILITY_NAMES.length)];
}
