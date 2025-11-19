import { gameState } from '../state/gameState.js';
import { spendMoneyOnVending } from '../items/vendingMachine.js';

const hitboxes = () => gameState.ui.hitboxes;

const clearVendingHitboxes = () => {
  hitboxes().vendingOptions.length = 0;
  hitboxes().vendingCloseButton = null;
};

export const closeVendingMenu = () => {
  gameState.ui.openVendingId = null;
  gameState.ui.vendingMessage = null;
  clearVendingHitboxes();
};

const currentVendingProp = () => (
  gameState.props.find((prop) => prop.id === gameState.ui.openVendingId)
);

const containsPoint = (rect, x, y) => (
  rect && x >= rect.x && x <= rect.x2 && y >= rect.y && y <= rect.y2
);

export const handleVendingClick = (screenX, screenY) => {
  if (!gameState.ui.openVendingId) return false;
  const closeHitbox = hitboxes().vendingCloseButton;
  if (containsPoint(closeHitbox, screenX, screenY)) {
    closeVendingMenu();
    return true;
  }
  const optionHit = hitboxes().vendingOptions.find((entry) => containsPoint(entry, screenX, screenY));
  if (!optionHit) return false;
  const prop = currentVendingProp();
  if (!prop) {
    closeVendingMenu();
    return true;
  }
  const option = prop.vendingOptions?.[optionHit.index];
  if (!option) return true;
  const result = spendMoneyOnVending(option.itemId, option.cost);
  if (result.success) {
    gameState.ui.vendingMessage = `${option.label} purchased.`;
  } else if (result.reason === 'insufficient_funds') {
    gameState.ui.vendingMessage = 'Not enough credits.';
  } else {
    gameState.ui.vendingMessage = 'Vending failed.';
  }
  return true;
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 20, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.36;
  const height = gameState.config.canvasHeight * 0.45;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(18, 28, 54, 0.95)';
  ctx.strokeStyle = '#6d8cff';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const drawCloseButton = (ctx, panel) => {
  const size = 24;
  const x = panel.x + panel.width - size - 8;
  const y = panel.y + 8;
  ctx.save();
  ctx.fillStyle = '#2f3e69';
  ctx.strokeStyle = '#8effd6';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, size, size);
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = '#8effd6';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', x + size / 2, y + size / 2);
  ctx.restore();
  hitboxes().vendingCloseButton = { x, y, x2: x + size, y2: y + size };
};

const drawTitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Vending Machine', panel.x + 20, panel.y + 12);
  ctx.restore();
};

const drawCreditsLine = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = gameState.config.creditsColor;
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Credits: ${gameState.player.money}`, panel.x + 20, panel.y + 48);
  ctx.restore();
};

const drawOptions = (ctx, panel, prop) => {
  const startY = panel.y + 90;
  const lineHeight = 40;
  const entries = prop.vendingOptions || [];
  hitboxes().vendingOptions.length = 0;
  entries.forEach((option, index) => {
    const y = startY + index * lineHeight;
    const affordable = gameState.player.money >= option.cost;
    ctx.save();
    ctx.fillStyle = affordable ? '#8effd6' : '#c06f6f';
    ctx.font = '22px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(option.label, panel.x + 24, y);
    ctx.textAlign = 'right';
    ctx.fillText(`${option.cost}₡`, panel.x + panel.width - 24, y);
    ctx.restore();
    hitboxes().vendingOptions.push({
      x: panel.x + 16,
      y: y - lineHeight / 2,
      x2: panel.x + panel.width - 16,
      y2: y + lineHeight / 2,
      index
    });
  });
};

const drawMessage = (ctx, panel) => {
  if (!gameState.ui.vendingMessage) return;
  ctx.save();
  ctx.fillStyle = '#fef3b7';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(gameState.ui.vendingMessage, panel.x + panel.width / 2, panel.y + panel.height - 16);
  ctx.restore();
};

export const renderVendingMenu = (ctx) => {
  if (!gameState.ui.openVendingId) {
    clearVendingHitboxes();
    return;
  }
  const prop = currentVendingProp();
  if (!prop) {
    closeVendingMenu();
    return;
  }
  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawCloseButton(ctx, panel);
  drawTitle(ctx, panel);
  drawCreditsLine(ctx, panel);
  drawOptions(ctx, panel, prop);
  drawMessage(ctx, panel);
};
