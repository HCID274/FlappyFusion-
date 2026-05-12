// Visual constants. Single source of truth for colors, fonts, sizes.
// See docs/game-design.md §13 for visual style guidance.

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

  font: {
    hud: '13px ui-monospace, "SF Mono", Menlo, monospace',
    floatLg: 'bold 24px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    floatSm: '16px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    combo: '800 28px "Inter", "Space Grotesk", "Noto Sans SC", "Noto Sans JP", "PingFang SC", "Hiragino Sans", system-ui, sans-serif',
    particleLabel: 'bold 24px ui-monospace, monospace',
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
