import { gameState } from '../state/gameState.js';

const hitboxes = () => gameState.ui.hitboxes;

const buttonRect = (screenX, screenY, rect) => (
  rect && screenX >= rect.x && screenX <= rect.x2 && screenY >= rect.y && screenY <= rect.y2
);

export const handleUpgradeButtonClick = (screenX, screenY) => {
  const rect = hitboxes().upgradeButton;
  if (!rect) return false;
  if (!buttonRect(screenX, screenY, rect)) return false;
  gameState.ui.showUpgrades = true;
  return true;
};

export const handleUpgradesClick = (screenX, screenY) => {
  if (!gameState.ui.showUpgrades) return false;
  const closeRect = hitboxes().upgradesOverlay.closeButton;
  if (buttonRect(screenX, screenY, closeRect)) {
    gameState.ui.showUpgrades = false;
    return true;
  }
  return true;
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(4, 6, 14, 0.75)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.4;
  const height = gameState.config.canvasHeight * 0.5;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(12, 18, 34, 0.95)';
  ctx.strokeStyle = '#6d8cff';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const upgradeList = () => {
  const upgrades = gameState.player.upgrades || {};
  return [
    { label: 'Keycard Locator', active: upgrades.keycardLocator },
    { label: 'Faster Hack', active: upgrades.hasFasterHack },
    { label: 'Efficient Hacking', active: upgrades.efficientHack },
    { label: 'Fast Lockpick', active: upgrades.fastLockpick },
    { label: 'Skeleton Key', active: upgrades.skeletonKey },
    { label: 'Master Virus', active: upgrades.masterVirus }
  ];
};

export const renderUpgrades = (ctx) => {
  if (!gameState.ui.showUpgrades) {
    hitboxes().upgradesOverlay.closeButton = null;
    return;
  }
  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  ctx.save();
  ctx.fillStyle = '#fefefe';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Current Upgrades', panel.x + 20, panel.y + 20);
  ctx.restore();
  const list = upgradeList();
  ctx.save();
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  list.forEach((entry, index) => {
    const y = panel.y + 70 + index * 32;
    ctx.fillStyle = entry.active ? '#8effd6' : '#7b84a2';
    ctx.fillText(`${entry.active ? '✓' : '✕'} ${entry.label}`, panel.x + 20, y);
  });
  ctx.restore();
  const closeSize = 28;
  const closeX = panel.x + panel.width - closeSize - 12;
  const closeY = panel.y + 12;
  ctx.save();
  ctx.fillStyle = '#2f3e69';
  ctx.strokeStyle = '#c5d8ff';
  ctx.lineWidth = 2;
  ctx.fillRect(closeX, closeY, closeSize, closeSize);
  ctx.strokeRect(closeX, closeY, closeSize, closeSize);
  ctx.fillStyle = '#c5d8ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText('X', closeX + closeSize / 2, closeY + closeSize / 2);
  ctx.restore();
  hitboxes().upgradesOverlay.closeButton = { x: closeX, y: closeY, x2: closeX + closeSize, y2: closeY + closeSize };
};
