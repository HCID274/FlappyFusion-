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
    deuterium: '#4499ff',
    tritium: '#44dd66',
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
    floatLg: 'bold 22px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    floatSm: '14px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    particleLabel: 'bold 12px ui-monospace, monospace',
  },

  size: {
    plasmaGlow: 1.7,
    instabilityR: 36,
  },
};
