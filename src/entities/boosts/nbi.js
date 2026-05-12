import { CONFIG } from '../../config.js';
import { THEME } from '../../theme.js';
import { getImage } from '../../assetLoader.js';

let nextId = 0;

export function createNbi(x, y) {
  const { width, height, hitBoxPaddingX, hitBoxPaddingY } = CONFIG.boosts.nbi;
  const hitW = width + hitBoxPaddingX * 2;
  const hitH = height + hitBoxPaddingY * 2;
  const b = {
    id: `nbi${nextId++}`,
    type: 'nbi',
    pos: { x, y },
    hitBox: { x: x - hitW / 2, y: y - hitH / 2, w: hitW, h: hitH },
    triggered: false,
    alpha: 1,
    radius: hitW / 2,
  };

  b.move = (dx) => {
    b.pos.x += dx;
    b.hitBox.x += dx;
  };
  b.render = (ctx) => drawNbi(ctx, b);
  return b;
}

function drawNbi(ctx, b) {
  if (b.triggered) b.alpha = Math.max(0.2, b.alpha - 0.06);
  const { width, height } = CONFIG.boosts.nbi;
  const img = getImage('boostNbi');

  ctx.save();
  ctx.globalAlpha = b.alpha;
  if (img) {
    ctx.shadowColor = THEME.colors.nbi;
    ctx.shadowBlur = 14;
    ctx.drawImage(img, b.pos.x - width / 2, b.pos.y - height / 2, width, height);
    ctx.restore();
    return;
  }

  const grad = ctx.createLinearGradient(b.pos.x - width / 2, b.pos.y, b.pos.x + width / 2, b.pos.y);
  grad.addColorStop(0, 'rgba(255, 68, 170, 0)');
  grad.addColorStop(0.5, 'rgba(255, 170, 221, 0.82)');
  grad.addColorStop(1, 'rgba(255, 68, 170, 0)');
  ctx.fillStyle = grad;
  ctx.shadowColor = THEME.colors.nbi;
  ctx.shadowBlur = 18;
  ctx.fillRect(b.pos.x - width / 2, b.pos.y - height / 2, width, height);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = THEME.colors.fusionGold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(b.pos.x - width * 0.35, b.pos.y);
  ctx.lineTo(b.pos.x + width * 0.35, b.pos.y);
  ctx.stroke();
  ctx.restore();
}
