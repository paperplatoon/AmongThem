import { gameState } from '../state/gameState.js';

const barWidth = 220;
const barHeight = 16;
const padding = 20;

const getStaminaFraction = () => {
  const { current, max } = gameState.player.stamina;
  return max > 0 ? current / max : 0;
};

const getOxygenFraction = () => {
  const { current, max } = gameState.player.oxygen;
  return max > 0 ? current / max : 0;
};

const drawOutline = (ctx, x, y) => {
  ctx.strokeStyle = '#1d3520';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barWidth, barHeight);
};

const drawFill = (ctx, x, y) => {
  const fraction = Math.max(0, Math.min(1, getStaminaFraction()));
  const width = barWidth * fraction;
  ctx.fillStyle = '#6bff92';
  ctx.fillRect(x, y, width, barHeight);
};

const drawBackground = (ctx, x, y) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x - 4, y - 4, barWidth + 8, barHeight + 8);
};

export const renderHud = (ctx) => {
  const x = padding;
  const y = gameState.config.canvasHeight - padding - barHeight;
  drawBackground(ctx, x, y);
  drawFill(ctx, x, y);
  drawOutline(ctx, x, y);
  const oxygenPercent = Math.max(0, Math.min(100, getOxygenFraction() * 100));
  const oxygenX = gameState.config.canvasWidth - padding - 100;
  const oxygenY = padding;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(oxygenX - 10, oxygenY - 10, 120, 40);
  ctx.fillStyle = '#6bff92';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`O2: ${oxygenPercent.toFixed(1)}%`, oxygenX, oxygenY);
};
