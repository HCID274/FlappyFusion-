// Single source of truth for all player-facing strings.
// Every leaf string must exist in both zh and ja, or the build fails.

import {
  getLocale,
  initLocale,
  onLocaleChange,
  setLocale,
  SUPPORTED_LOCALES,
  textFromCatalog,
  validateCatalog,
  valueFromCatalog,
} from './i18n.js';

export { getLocale, initLocale, onLocaleChange, setLocale, SUPPORTED_LOCALES };

export const CONTENT = {
  zh: {
    ui: {
      pageTitle: '磁约束生存挑战 — 糟谷研究室',
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
      languageLabel: '语言',
      languageIcon: '语',
      languageToggleLabel: '切换语言: 当前 {current}, 点击切换到 {next}',
    },
    language: {
      zh: '中文',
      ja: '日本語',
    },
    tutorial: '按 [空格] 触发磁场脉冲,把等离子体悬浮在腔室中央。\n撞上炉壁或偏滤器 = 实验失败。\n吃 D + T 触发聚变反应。',
    units: {
      tenThousandDegrees: '{value} 万度',
      hundredMillionDegrees: '{value} 亿度',
    },
    hud: {
      temperature: '🌡 {temperature}',
      inventory: 'D:{d}  T:{t}',
      score: '★ {score}',
      time: '⏱ {seconds} s',
      fuelBay: {
        label: '燃料舱',
        fusionReady: '⚡ 聚变就绪 ⚡',
        he4: 'He⁴ ×{fusionCount}',
      },
    },
    particleLabels: {
      he4: 'He⁴',
      neutron: 'n',
      fusionScore: '+5',
      lithiumBreeding: '⁶Li → T 增殖\n+2',
      tungstenCooling: '钨杂质溅射\n等离子体冷却 −1 档',
      nbiHeating: '中性束加热!\n+1 档',
    },
    combo: {
      label1: 'He⁴  +{score}',
      label2: '⚡ COMBO ×2   +{score}',
      label3: '⚡⚡ COMBO ×3   +{score}',
      label4: '⚡⚡⚡ COMBO ×4   +{score}',
      label5: '⚡⚡⚡⚡ MAX COMBO   +{score}',
    },
    milestones: {
      50: '已超过太阳核心温度',
      80: '接近劳森判据下限',
      100: '达到聚变点火温度!',
      150: '超越 ITER 设计参数',
      200: '已突破现役实验最高纪录',
    },
    death: {
      titles: {
        wall: '等离子体接触炉壁',
        divertor: '偏滤器板汽化',
        instability: 'MHD 不稳定性失控',
      },
      stats: '你坚持了 {seconds} 秒,达到了 {temperature}\n完成 {fusionCount} 次聚变反应',
      iterFooter: 'ITER 用 13 T 的超导磁场约束 1.5 亿度等离子体,目标维持 400 秒以上的聚变反应。',
      bodies: {
        t1: '等离子体非常脆弱——哪怕是最初的 1000 万度,\n也已经把任何固体材料瞬间汽化。\n这就是为什么我们需要磁场把它"悬空"住,\n让它一刻都不接触炉壁。',
        t2: '不错的开局!你已经把等离子体加热到了 {temperature}。\n作为参考:太阳核心约 1500 万度,\n你已经远远超过它了——只是比起聚变反应需要的温度\n还差一些。',
        t3: '{temperature} —— 你已经超过太阳核心了。\n但要让氘氚发生足够多的聚变反应,\n人类需要的是太阳核心 5–10 倍的温度。\n原因很简单:地球上没有太阳那样的引力压力,\n我们只能靠"更高温度"来弥补。',
        t4: '{temperature} —— 你触到了"劳森判据"的门口。\n这是工程上判断聚变能否净产能的指标:\n温度、密度、约束时间三者乘积要够大。\n你已经搞定了温度,真实的 ITER 还得搞定后两个。',
        t5: '🎉 {temperature} —— 你点火了!\n\n聚变点火温度是 1 亿度。这是地球上人为创造的\n最极端环境之一。\n你坚持了 {seconds} 秒、完成了 {fusionCount} 次聚变。\n现实中 ITER 的目标是稳定维持 400 秒以上。',
        t6: '{temperature} —— 已经超越 ITER 的设计参数了。\n你大概是研究室的人,或者天赋异禀。\n我们办公室在 3 楼,欢迎来聊。',
      },
    },
    instabilityNames: ['撕裂模', '气球模', '锯齿模'],
    learnMore: [
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
    ],
  },
  ja: {
    ui: {
      pageTitle: '磁場閉じ込めサバイバル — 糟谷研究室',
      title: '磁場閉じ込めサバイバル',
      subtitle: '— Tokamak Plasma Confinement —',
      lab: '糟谷研究室 · オープンキャンパス',
      startHint: '[スペース] で開始',
      restartHint: '[スペース] でもう一度',
      btnRestart: 'もう一度',
      btnLearnMore: '詳しく見る ↗',
      btnClose: '閉じる',
      btnNext: '次へ →',
      btnPrev: '← 前へ',
      languageLabel: '言語',
      languageIcon: '语',
      languageToggleLabel: '言語を切り替え: 現在 {current}, クリックで {next} へ',
    },
    language: {
      zh: '中国語',
      ja: '日本語',
    },
    tutorial: '[スペース] で磁場パルスを出し,プラズマを炉心中央に浮かせます。\n炉壁やダイバータに触れると実験失敗。\nD + T を集めると核融合反応が起きます。',
    units: {
      tenThousandDegrees: '{value} 万度',
      hundredMillionDegrees: '{value} 億度',
    },
    hud: {
      temperature: '🌡 {temperature}',
      inventory: 'D:{d}  T:{t}',
      score: '★ {score}',
      time: '⏱ {seconds} s',
      fuelBay: {
        label: '燃料ベイ',
        fusionReady: '⚡ 核融合準備完了 ⚡',
        he4: 'He⁴ ×{fusionCount}',
      },
    },
    particleLabels: {
      he4: 'He⁴',
      neutron: 'n',
      fusionScore: '+5',
      lithiumBreeding: '⁶Li → T 増殖\n+2',
      tungstenCooling: 'タングステン混入\nプラズマ冷却 −1 段',
      nbiHeating: '中性粒子ビーム加熱!\n+1 段',
    },
    combo: {
      label1: 'He⁴  +{score}',
      label2: '⚡ COMBO ×2   +{score}',
      label3: '⚡⚡ COMBO ×3   +{score}',
      label4: '⚡⚡⚡ COMBO ×4   +{score}',
      label5: '⚡⚡⚡⚡ MAX COMBO   +{score}',
    },
    milestones: {
      50: '太陽中心温度を超えた',
      80: 'ローソン条件の下限に近づいた',
      100: '核融合点火温度に到達!',
      150: 'ITER の設計値を超えた',
      200: '現役実験の最高記録を突破',
    },
    death: {
      titles: {
        wall: 'プラズマが炉壁に接触',
        divertor: 'ダイバータ板が蒸発',
        instability: 'MHD 不安定性が制御不能',
      },
      stats: '{seconds} 秒間持ちこたえ,最高温度は {temperature}\n核融合反応を {fusionCount} 回起こしました',
      iterFooter: 'ITER は 13 T の超伝導磁場で 1.5 億度のプラズマを閉じ込め,400 秒以上の核融合反応維持を目標にしています。',
      bodies: {
        t1: 'プラズマはとても繊細です。最初の 1000 万度でさえ,\nどんな固体材料も一瞬で蒸発させます。\nだから磁場で「浮かせ」,\n炉壁に一瞬も触れさせない必要があります。',
        t2: 'よい立ち上がりです!プラズマを {temperature} まで加熱できました。\n参考までに,太陽中心は約 1500 万度。\nすでに大きく超えていますが,核融合反応に必要な温度には\nまだ少し届いていません。',
        t3: '{temperature} —— 太陽中心を超えました。\nただし重水素と三重水素を十分に核融合させるには,\n人類には太陽中心の 5–10 倍の温度が必要です。\n理由は単純です。地球には太陽のような重力圧がないため,\n「より高い温度」で補うしかありません。',
        t4: '{temperature} —— 「ローソン条件」の入り口に届きました。\nこれは核融合で正味のエネルギーを出せるかを判断する工学指標です。\n温度・密度・閉じ込め時間の積を十分大きくする必要があります。\n温度は達成しました。実際の ITER では残り 2 つも必要です。',
        t5: '🎉 {temperature} —— 点火しました!\n\n核融合点火温度は 1 億度。地球上で人類が作る\n最も極端な環境の一つです。\n{seconds} 秒間維持し,{fusionCount} 回の核融合に成功しました。\n現実の ITER は 400 秒以上の安定維持を目指しています。',
        t6: '{temperature} —— すでに ITER の設計値を超えています。\nあなたは研究室の人か,かなり才能があります。\n私たちのオフィスは 3 階です。ぜひ話しに来てください。',
      },
    },
    instabilityNames: ['テアリングモード', 'バルーニングモード', '鋸歯状振動'],
    learnMore: [
      {
        heading: 'なぜ核融合を目指すのか?',
        body: '1 g の重水素・三重水素燃料  ≈  石油 8 トン  ≈  石炭 11 トン\n\n温室効果ガスをほとんど出さず,\n原料は海水から取り出せます。',
      },
      {
        heading: '何が難しいのか',
        body: '難しいのは「1 億度まで加熱すること」ではなく,\n「1 億度のものをどんな容器にも触れさせないこと」です。\n\nどんな固体も触れた瞬間に蒸発し,プラズマを汚染します。\n実現できる方法はただ一つ。強い磁場で「浮かせる」ことです。\n\nITER の超伝導磁石は 1 万トンあり,\n13 T の磁場を作ります。これは地球磁場の 26 万倍です。',
      },
      {
        heading: '私たちが取り組むこと',
        body: '糟谷研究室 — 磁場閉じ込め核融合\n\n[研究室 QR コード仮置き]\n\n遊んでくれてありがとうございます!',
      },
    ],
  },
};

export function validateContentCatalog() {
  return validateCatalog(CONTENT, SUPPORTED_LOCALES);
}

validateContentCatalog();

export function t(path, values = {}) {
  return textFromCatalog(CONTENT, path, values);
}

export const hud = {
  temperature: (temperature) => t('hud.temperature', { temperature: formatTemperature(temperature) }),
  inventory: (d, tritium) => t('hud.inventory', { d, t: tritium }),
  score: (score) => t('hud.score', { score }),
  time: (seconds) => t('hud.time', { seconds: Math.floor(seconds) }),
  fuelBayLabel: () => t('hud.fuelBay.label'),
  fusionReady: () => t('hud.fuelBay.fusionReady'),
  he4: (fusionCount) => t('hud.fuelBay.he4', { fusionCount }),
};

export function formatTemperature(M) {
  if (M < 100) return t('units.tenThousandDegrees', { value: M * 10 });
  const yi = M / 100;
  const value = Number.isInteger(yi) ? yi : yi.toFixed(1);
  return t('units.hundredMillionDegrees', { value });
}

export function getMilestoneText(temp) {
  const milestones = valueFromCatalog(CONTENT, 'milestones');
  return milestones[temp] || null;
}

export function getDeathTitle(cause) {
  const titles = valueFromCatalog(CONTENT, 'death.titles');
  return titles[cause] || titles.wall;
}

export function getDeathStats({ seconds, fusionCount, maxTemp }) {
  return t('death.stats', {
    seconds,
    fusionCount,
    temperature: formatTemperature(maxTemp),
  });
}

export function getDeathBody({ seconds, fusionCount, maxTemp }) {
  const temperature = formatTemperature(maxTemp);
  const tier = getDeathTier(maxTemp);
  const body = t(`death.bodies.${tier}`, { temperature, seconds, fusionCount });
  return {
    body,
    footer: shouldShowIterFooter(tier) ? t('death.iterFooter') : null,
  };
}

export function pickInstabilityName() {
  const names = valueFromCatalog(CONTENT, 'instabilityNames');
  return names[Math.floor(Math.random() * names.length)];
}

export function getLearnMorePages() {
  return valueFromCatalog(CONTENT, 'learnMore');
}

export function getParticleLabel(name) {
  return t(`particleLabels.${name}`);
}

export function getComboLabel(combo, score) {
  const key = Math.min(Math.max(combo, 1), 5);
  return t(`combo.label${key}`, { score });
}

function getDeathTier(maxTemp) {
  if (maxTemp < 30) return 't1';
  if (maxTemp < 50) return 't2';
  if (maxTemp < 80) return 't3';
  if (maxTemp < 100) return 't4';
  if (maxTemp < 150) return 't5';
  return 't6';
}

function shouldShowIterFooter(tier) {
  return tier === 't1' || tier === 't2' || tier === 't3' || tier === 't4';
}
