// Visual constants. Single source of truth for colors, fonts, sizes.
// See docs/game-design.md §13 for visual style guidance.

export const MINCHO_FONT =
  '"Yu Mincho", YuMincho, "Hiragino Mincho ProN", "Hiragino Mincho Pro", "MS PMincho", "MS Mincho", "Noto Serif JP", "Source Han Serif JP", serif';

export const ZH_FONT =
  '"Microsoft YaHei", "Noto Sans SC", "PingFang SC", sans-serif';

const FONT_BY_LOCALE = {
  ja: MINCHO_FONT,
  zh: ZH_FONT,
};

export function getFontStack(locale = 'zh') {
  return FONT_BY_LOCALE[locale] || ZH_FONT;
}

export function getThemeFonts(locale = 'zh') {
  const family = getFontStack(locale);
  return {
    family,
    displayFamily: family,
    hud: `13px ${family}`,
    floatLg: `bold 24px ${family}`,
    floatSm: `16px ${family}`,
    combo: `800 28px ${family}`,
    particleLabel: `bold 24px ${family}`,
  };
}

export function applyDocumentFonts(locale = 'zh', root) {
  const target = root || (typeof document !== 'undefined' ? document.documentElement : null);
  if (!target) return;
  target.style.setProperty('--font-app', getFontStack(locale));
}

export const THEME = {
  colors: {
    bg: '#0a0e27',
    bgGrid: 'rgba(68, 221, 255, 0.06)',
    plasma: '#ff44aa',
    plasmaCore: '#ffccee',
    magneticLine: '#44ddff',
    danger: '#ff5544',
    fusionGold: '#ffcc44',
    electron: '#aaffff',
    deuterium: '#4499ff',
    tritium: '#44dd66',
    lithium6: '#cc88ff',
    tungsten: '#ccd0d8',
    nbi: '#ff44aa',
    instability: '#ff5544',
    wall: '#3a4570',
    wallEdge: '#5566aa',
    wallWarning: 'rgba(255, 85, 68, 0.35)',
    text: '#ffffff',
    textDim: 'rgba(255,255,255,0.65)',
    he4: '#ff7755',
    neutron: '#ffffff',
  },

  combo: [
    { fontSize: 28, color: '#ffcc44', stroke: '#000000', strokeWidth: 1, shadowBlur: 8, overshoot: 1.15, weight: 800 },
    { fontSize: 36, color: '#ff8844', stroke: '#000000', strokeWidth: 1.5, shadowBlur: 12, overshoot: 1.20, weight: 800 },
    { fontSize: 44, color: '#ff4477', stroke: '#000000', strokeWidth: 2, shadowBlur: 16, overshoot: 1.25, weight: 900 },
    { fontSize: 56, color: '#ff44dd', stroke: '#000000', strokeWidth: 2, shadowBlur: 22, overshoot: 1.30, weight: 900 },
    { fontSize: 72, color: '#ffffff', stroke: '#ff44dd', strokeWidth: 4, shadowBlur: 30, overshoot: 1.40, weight: 900 },
  ],

  phase: {
    IGNITION_PREP: '#5566aa',
    HEATING: '#ff44aa',
    CRITICAL: '#ff5544',
    IGNITION_BURST: '#ffcc44',
    RECORD: '#ffffff',
  },

  glow: {
    deep: { color: '#5566aa', alpha: 0.05 },
    magenta: { color: '#ff44aa', alpha: 0.12 },
    redOrange: { color: '#ff5544', alpha: 0.18 },
    gold: { color: '#ffcc44', alpha: 0.25 },
    whiteHot: { color: '#ffffff', alpha: 0.2 },
  },

  size: {
    plasmaGlow: 1.7,
    instabilityR: 36,
  },
};
