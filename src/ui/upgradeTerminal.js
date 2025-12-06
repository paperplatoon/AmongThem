import { gameState } from '../state/gameState.js';
import { OverlayId, closeOverlay, isOverlayActive } from '../state/overlayManager.js';
import { addClickRipple, addFloatingText } from '../state/visualEffects.js';
import { purchaseUpgrade, getUpgradeCost } from '../upgrades/upgradeTerminalState.js';

const clearHitboxes = () => {
  gameState.ui.upgradeTerminal.closeButton = null;
  gameState.ui.upgradeTerminal.upgradeButtons.length = 0;
};

export const handleUpgradeTerminalClick = (screenX, screenY) => {
  if (!isOverlayActive(OverlayId.UPGRADE_TERMINAL)) return false;

  // Check close button
  const closeHitbox = gameState.ui.upgradeTerminal.closeButton;
  if (closeHitbox && screenX >= closeHitbox.x && screenX <= closeHitbox.x2 && screenY >= closeHitbox.y && screenY <= closeHitbox.y2) {
    addClickRipple((closeHitbox.x + closeHitbox.x2) / 2, (closeHitbox.y + closeHitbox.y2) / 2, '#ff6b6b');
    closeOverlay();
    return true;
  }

  // Check upgrade buttons
  const upgradeButtons = gameState.ui.upgradeTerminal.upgradeButtons;
  const hit = upgradeButtons.find(btn =>
    screenX >= btn.x && screenX <= btn.x2 && screenY >= btn.y && screenY <= btn.y2
  );

  if (hit) {
    const centerX = (hit.x + hit.x2) / 2;
    const centerY = (hit.y + hit.y2) / 2;
    addClickRipple(centerX, centerY, '#2dd4bf');

    // Attempt purchase
    const result = purchaseUpgrade(hit.upgradeId);

    if (result.success) {
      addFloatingText(centerX, centerY, `Purchased! -${result.cost}₡`, '#2dd4bf');
    } else {
      // Show error message
      let message = 'Cannot purchase';
      if (result.reason === 'already_owned') message = 'Already owned';
      else if (result.reason === 'insufficient_funds') message = 'Not enough credits';
      addFloatingText(centerX, centerY, message, '#ff6b6b');
    }

    return true;
  }

  return false;
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 20, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.65;
  const height = gameState.config.canvasHeight * 0.8;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(18, 28, 54, 0.95)';
  ctx.strokeStyle = '#2dd4bf';
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
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#8effd6';
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = '#8effd6';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', x + size / 2, y + size / 2);
  ctx.restore();
  gameState.ui.upgradeTerminal.closeButton = { x, y, x2: x + size, y2: y + size };
};

const drawTitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#fefefe';
  ctx.font = '32px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('UPGRADE TERMINAL', panel.x + panel.width / 2, panel.y + 16);
  ctx.restore();
};

const drawSubtitle = (ctx, panel) => {
  const playerMoney = gameState.player.money || 0;
  ctx.save();
  ctx.fillStyle = '#2dd4bf';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`Available Credits: ${playerMoney}₡`, panel.x + panel.width / 2, panel.y + 56);
  ctx.restore();
};

const drawUpgradeList = (ctx, panel) => {
  const availableUpgrades = gameState.upgradeTerminal.availableUpgrades;
  const saleUpgradeId = gameState.upgradeTerminal.saleUpgradeId;
  const hitboxes = gameState.ui.upgradeTerminal.upgradeButtons;

  ctx.save();
  ctx.font = '20px "Courier New", monospace';
  ctx.textBaseline = 'top';

  const startY = panel.y + 100;
  const rowHeight = 100;
  const leftMargin = panel.x + 30;
  const rightMargin = panel.x + panel.width - 30;
  const boxWidth = rightMargin - leftMargin;

  availableUpgrades.forEach((upgrade, index) => {
    const y = startY + index * rowHeight;
    const cost = getUpgradeCost(upgrade);
    const isOwned = upgrade.ownershipCheck();
    const isSale = upgrade.id === saleUpgradeId;

    // Draw background box
    ctx.fillStyle = isOwned ? 'rgba(50, 50, 50, 0.4)' : 'rgba(30, 40, 70, 0.6)';
    ctx.fillRect(leftMargin, y, boxWidth, rowHeight - 10);
    ctx.strokeStyle = isOwned ? '#555' : '#2dd4bf';
    ctx.lineWidth = 1;
    ctx.strokeRect(leftMargin, y, boxWidth, rowHeight - 10);

    // Draw upgrade name
    ctx.fillStyle = isOwned ? '#888' : '#fefefe';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(upgrade.label, leftMargin + 15, y + 10);

    // Draw description
    ctx.fillStyle = isOwned ? '#666' : '#a0c0ff';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText(upgrade.description, leftMargin + 15, y + 38);

    // Draw price
    ctx.textAlign = 'right';
    if (isOwned) {
      ctx.fillStyle = '#888';
      ctx.font = '18px "Courier New", monospace';
      ctx.fillText('OWNED', rightMargin - 15, y + 10);
    } else {
      if (isSale) {
        // Show original price crossed out
        ctx.fillStyle = '#888';
        ctx.font = '16px "Courier New", monospace';
        const origX = rightMargin - 15;
        ctx.fillText(`${upgrade.baseCost}₡`, origX, y + 10);

        // Draw strikethrough
        const textWidth = ctx.measureText(`${upgrade.baseCost}₡`).width;
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(origX - textWidth, y + 18);
        ctx.lineTo(origX, y + 18);
        ctx.stroke();

        // Show sale price
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText(`${cost}₡ SALE!`, rightMargin - 15, y + 35);
      } else {
        ctx.fillStyle = '#2dd4bf';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText(`${cost}₡`, rightMargin - 15, y + 10);
      }
    }

    // Add hitbox (even for owned upgrades to show feedback)
    hitboxes.push({
      upgradeId: upgrade.id,
      x: leftMargin,
      y: y,
      x2: rightMargin,
      y2: y + rowHeight - 10
    });
  });

  ctx.restore();
};

export const renderUpgradeTerminal = (ctx) => {
  if (!isOverlayActive(OverlayId.UPGRADE_TERMINAL)) {
    clearHitboxes();
    return;
  }

  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawCloseButton(ctx, panel);
  drawTitle(ctx, panel);
  drawSubtitle(ctx, panel);
  drawUpgradeList(ctx, panel);
};
