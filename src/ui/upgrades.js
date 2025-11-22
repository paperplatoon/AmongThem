import { gameState } from '../state/gameState.js';
import { hasSkeletonKeyUpgrade, hasMasterVirusUpgrade, hasElectricBootsUpgrade } from '../state/upgradeSelectors.js';
import { isTestingModeEnabled, toggleTestingMode } from '../state/testingMode.js';
import { OverlayId, toggleOverlay, isOverlayActive, closeOverlay } from '../state/overlayManager.js';

const hitboxes = () => gameState.ui.hitboxes;

const buttonRect = (screenX, screenY, rect) => (
  rect && screenX >= rect.x && screenX <= rect.x2 && screenY >= rect.y && screenY <= rect.y2
);

export const handleUpgradeButtonClick = (screenX, screenY) => {
  const rect = hitboxes().upgradeButton;
  if (!rect) return false;
  if (!buttonRect(screenX, screenY, rect)) return false;
  toggleOverlay(OverlayId.UPGRADES);
  return true;
};

export const handleUpgradesClick = (screenX, screenY) => {
  if (!isOverlayActive(OverlayId.UPGRADES)) return false;
  const overlay = hitboxes().upgradesOverlay;
  if (buttonRect(screenX, screenY, overlay.testingToggle)) {
    toggleTestingMode();
    return true;
  }
  const closeRect = overlay.closeButton;
  if (buttonRect(screenX, screenY, closeRect)) {
    closeOverlay();
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
  const allUpgrades = [
    { label: 'Keycard Locator', active: upgrades.keycardLocator },
    { label: 'Faster Hack', active: upgrades.hasFasterHack },
    { label: 'Efficient Hacking', active: upgrades.efficientHack },
    { label: 'Fast Lockpick', active: upgrades.fastLockpick },
    { label: 'Skeleton Key', active: hasSkeletonKeyUpgrade() },
    { label: 'Master Virus', active: hasMasterVirusUpgrade() },
    { label: 'Electric Boots', active: hasElectricBootsUpgrade() }
  ];
  return allUpgrades.filter((upgrade) => upgrade.active);
};

const drawTestingToggle = (ctx, panel, list) => {
  const active = isTestingModeEnabled();
  const width = panel.width - 60;
  const height = 30;
  const x = panel.x + 30;
  const y = panel.y + 70 + list.length * 32 + 20;
  ctx.save();
  ctx.fillStyle = active ? '#1f4d3f' : '#2f3e69';
  ctx.strokeStyle = active ? '#3dd17a' : '#6d8cff';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = '#fefefe';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = active ? 'Testing Mode: ON' : 'Testing Mode: OFF';
  ctx.fillText(label, x + width / 2, y + height / 2);
  ctx.restore();
  hitboxes().upgradesOverlay.testingToggle = { x, y, x2: x + width, y2: y + height };
};

export const renderUpgrades = (ctx) => {
  if (!isOverlayActive(OverlayId.UPGRADES)) {
    hitboxes().upgradesOverlay.closeButton = null;
    hitboxes().upgradesOverlay.testingToggle = null;
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
  if (list.length === 0) {
    ctx.fillStyle = '#7b84a2';
    ctx.fillText('No upgrades yet', panel.x + 20, panel.y + 70);
  } else {
    list.forEach((entry, index) => {
      const y = panel.y + 70 + index * 32;
      ctx.fillStyle = '#8effd6';
      ctx.fillText(`✓ ${entry.label}`, panel.x + 20, y);
    });
  }
  ctx.restore();
  drawTestingToggle(ctx, panel, list);
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
