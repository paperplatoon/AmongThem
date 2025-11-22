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
  if (optionHit.disabled) return true;
  const prop = currentVendingProp();
  if (!prop) {
    closeVendingMenu();
    return true;
  }
  const option = prop.vendingOptions?.[optionHit.index];
  if (!option) return true;
  if (option.itemId === 'taser' && gameState.player.taser?.hasTaser) {
    gameState.ui.vendingMessage = 'Taser already owned.';
    return true;
  }
  if (option.itemId === 'keycard_locator' && gameState.player.upgrades?.keycardLocator) {
    gameState.ui.vendingMessage = 'Keycard locator already owned.';
    return true;
  }
  if (option.itemId === 'faster_hack' && gameState.player.upgrades?.hasFasterHack) {
    gameState.ui.vendingMessage = 'Faster hack already owned.';
    return true;
  }
  if (option.itemId === 'efficient_hack' && gameState.player.upgrades?.efficientHack) {
    gameState.ui.vendingMessage = 'Efficient hacking already owned.';
    return true;
  }
  if (option.itemId === 'fast_lockpick' && gameState.player.upgrades?.fastLockpick) {
    gameState.ui.vendingMessage = 'Fast lockpick already owned.';
    return true;
  }
  if (option.itemId === 'efficient_hack' && gameState.player.upgrades?.efficientHack) {
    gameState.ui.vendingMessage = 'Efficient hacking already owned.';
    return true;
  }
  const price = (() => {
    if (option.itemId === 'taser') {
      return gameState.testing ? gameState.config.taser.testCost : option.cost;
    }
    if (option.itemId === 'keycard_locator') {
      return gameState.testing ? 0 : option.cost;
    }
    if (option.itemId === 'faster_hack') {
      return gameState.testing ? 20 : option.cost;
    }
    if (option.itemId === 'efficient_hack') {
      return gameState.testing ? 0 : option.cost;
    }
    if (option.itemId === 'fast_lockpick') {
      return gameState.testing ? 0 : option.cost;
    }
    if (option.itemId === 'efficient_hack') {
      return gameState.testing ? 0 : option.cost;
    }
    return option.cost;
  })();
  const result = spendMoneyOnVending(option.itemId, price);
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
    const owned = (option.itemId === 'taser' && gameState.player.taser?.hasTaser)
      || (option.itemId === 'keycard_locator' && gameState.player.upgrades?.keycardLocator)
      || (option.itemId === 'faster_hack' && gameState.player.upgrades?.hasFasterHack)
      || (option.itemId === 'efficient_hack' && gameState.player.upgrades?.efficientHack)
      || (option.itemId === 'fast_lockpick' && gameState.player.upgrades?.fastLockpick);
    const price = (() => {
      if (option.itemId === 'taser') return gameState.testing ? gameState.config.taser.testCost : option.cost;
      if (option.itemId === 'keycard_locator') return gameState.testing ? 0 : option.cost;
      if (option.itemId === 'faster_hack') return gameState.testing ? 20 : option.cost;
      if (option.itemId === 'efficient_hack') return gameState.testing ? 0 : option.cost;
      if (option.itemId === 'fast_lockpick') return gameState.testing ? 0 : option.cost;
      return option.cost;
    })();
    const affordable = gameState.player.money >= price;
    ctx.save();
    ctx.fillStyle = owned ? '#7b84a2' : affordable ? '#8effd6' : '#c06f6f';
    ctx.font = '22px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const label = owned ? `${option.label} (Owned)` : option.label;
    ctx.fillText(label, panel.x + 24, y);
    ctx.textAlign = 'right';
    if (!owned) ctx.fillText(`${price}₡`, panel.x + panel.width - 24, y);
    ctx.restore();
    hitboxes().vendingOptions.push({
      x: panel.x + 16,
      y: y - lineHeight / 2,
      x2: panel.x + panel.width - 16,
      y2: y + lineHeight / 2,
      index,
      disabled: owned
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
