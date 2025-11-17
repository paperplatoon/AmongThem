import { gameState } from '../state/gameState.js';

const panelPadding = 40;

const clearButtonHitbox = () => {
  gameState.ui.hitboxes.gameOverButton = null;
};

const setButtonHitbox = (rect) => {
  gameState.ui.hitboxes.gameOverButton = rect;
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 6, 12, 0.8)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.6;
  const height = gameState.config.canvasHeight * 0.4;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 24, 46, 0.95)';
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 3;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const drawTitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#ff6b6b';
  ctx.font = '48px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Game Over', panel.x + panel.width / 2, panel.y + panelPadding);
  ctx.restore();
};

const drawMessage = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '24px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('The Aletheia claims another investigator.', panel.x + panel.width / 2, panel.y + panelPadding + 70);
  ctx.fillText('Click below to begin a new run.', panel.x + panel.width / 2, panel.y + panelPadding + 110);
  ctx.restore();
};

const drawButton = (ctx, panel) => {
  const width = 220;
  const height = 48;
  const x = panel.x + (panel.width - width) / 2;
  const y = panel.y + panel.height - panelPadding - height;
  ctx.save();
  ctx.fillStyle = '#1b2d4f';
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = '#f4f9ff';
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('New Investigation', x + width / 2, y + height / 2);
  ctx.restore();
  setButtonHitbox({ x, y, x2: x + width, y2: y + height });
};

export const renderGameOver = (ctx) => {
  if (!gameState.ui.showGameOver) {
    clearButtonHitbox();
    return;
  }
  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawTitle(ctx, panel);
  drawMessage(ctx, panel);
  drawButton(ctx, panel);
};

export const handleGameOverClick = (screenX, screenY) => {
  if (!gameState.ui.showGameOver) return false;
  const hit = gameState.ui.hitboxes.gameOverButton;
  if (!hit) return false;
  if (screenX >= hit.x && screenX <= hit.x2 && screenY >= hit.y && screenY <= hit.y2) {
    window.location.reload();
    return true;
  }
  return false;
};
