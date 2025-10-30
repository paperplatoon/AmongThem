import { gameState } from '../state/gameState.js';

const toggle = () => { gameState.ui.showInventory = !gameState.ui.showInventory; };

export const handleInventoryToggle = (key) => {
  if (key === 'i') toggle();
};

const drawBackground = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 10, 31, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.6;
  const height = gameState.config.canvasHeight * 0.6;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 24, 48, 0.9)';
  ctx.strokeStyle = '#4f7bd9';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const drawHeader = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '32px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Inventory', panel.x + 32, panel.y + 24);
  ctx.restore();
};

const drawItems = (ctx, panel) => {
  const entries = gameState.inventory;
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (entries.length === 0) {
    ctx.fillText('No items collected.', panel.x + 32, panel.y + 80);
    ctx.restore();
    return;
  }
  entries.forEach((entry, index) => {
    const lineY = panel.y + 80 + index * 36;
    ctx.fillText(`Item ${entry.label}`, panel.x + 32, lineY);
  });
  ctx.restore();
};

export const renderInventory = (ctx) => {
  if (!gameState.ui.showInventory) return;
  drawBackground(ctx);
  const panel = drawPanel(ctx);
  drawHeader(ctx, panel);
  drawItems(ctx, panel);
};
