import { gameState } from '../state/gameState.js';
import { activateBloodDetector } from '../bloodDetector/bloodDetectorSystem.js';
import { addClickRipple } from '../state/visualEffects.js';

const barWidth = 220;
const barHeight = 16;
const padding = 20;

const getStaminaFraction = () => {
  const { current, max } = gameState.player.stamina;
  return max > 0 ? current / max : 0;
};

const getHealthFraction = () => {
  const { current, max } = gameState.player.health;
  return max > 0 ? current / max : 0;
};

const getOxygenFraction = () => {
  const { current, max } = gameState.player.oxygen;
  return max > 0 ? current / max : 0;
};

const drawCredits = (ctx) => {
  const x = padding;
  const y = padding + barHeight + 12;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x - 6, y - 6, 180, 32);
  ctx.fillStyle = gameState.config.creditsColor;
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const symbol = gameState.config.creditsSymbol || '₡';
  ctx.fillText(`${symbol} ${gameState.player.money}`, x + 4, y + 10);
};

const drawTaserStatus = (ctx) => {
  const taser = gameState.player.taser;
  if (!taser || !taser.hasTaser) return;
  const iconX = padding;
  const iconY = padding + barHeight + 50;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(iconX - 8, iconY - 8, 60, 40);
  ctx.fillStyle = '#f5d442';
  if (taser.cooldownRemaining <= 0) {
    ctx.font = '28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', iconX + 22, iconY + 12);
  } else {
    ctx.fillStyle = '#fefefe';
    ctx.font = '20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const remaining = Math.ceil(taser.cooldownRemaining);
    ctx.fillText(`${remaining}`, iconX + 22, iconY + 12);
  }
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('TASER', iconX + 22, iconY + 18);
};

const drawHackStatus = (ctx) => {
  const upgrades = gameState.player.upgrades;
  if (!upgrades?.hasFasterHack) return;
  const iconX = padding + 70;
  const iconY = padding + barHeight + 50;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(iconX - 8, iconY - 8, 60, 40);
  ctx.fillStyle = '#8effd6';
  ctx.font = '24px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⏩', iconX + 22, iconY + 8);
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '12px "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('HACK', iconX + 22, iconY + 18);
};

const drawUpgradeButton = (ctx) => {
  const width = 150;
  const height = 32;
  const x = gameState.config.canvasWidth - padding - width;
  const y = padding + 55;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x - 4, y - 4, width + 8, height + 8);
  ctx.fillStyle = '#1f2a4f';
  ctx.strokeStyle = '#8effd6';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = '#fefefe';
  ctx.font = '16px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('View Upgrades', x + width / 2, y + height / 2);
  ctx.restore();
  gameState.ui.hitboxes.upgradeButton = { x, y, x2: x + width, y2: y + height };
};

const drawBloodDetector = (ctx) => {
  const detector = gameState.bloodDetector;
  const width = 180;
  const height = 36;
  const x = padding;
  const y = gameState.config.canvasHeight - padding - barHeight - height - 12;

  ctx.save();

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x - 4, y - 4, width + 8, height + 8);

  // Determine state and colors
  let bgColor, borderColor, textColor, displayText;
  let isClickable = false;

  if (gameState.case.bloodSampleCollected) {
    // Sample collected - grey out
    bgColor = '#2f3e69';
    borderColor = '#7b84a2';
    textColor = '#7b84a2';
    displayText = 'Sample Collected';
  } else if (detector.active) {
    // Counting down
    bgColor = '#3d2f1f';
    borderColor = '#ffd24a';
    textColor = '#ffd24a';
    const remaining = Math.ceil(detector.countdownRemaining);
    displayText = `Scanning... ${remaining}s`;
  } else if (detector.lastReading !== null) {
    // Showing result
    if (detector.lastReading === 'none') {
      bgColor = '#3d1f1f';
      borderColor = '#ff6b6b';
      textColor = '#ff6b6b';
      displayText = 'None detected';
    } else {
      bgColor = '#1f3d1f';
      borderColor = '#6bff92';
      textColor = '#6bff92';
      displayText = `Distance: ${detector.lastReading} cells`;
    }
    isClickable = true;
  } else {
    // Idle
    bgColor = '#1f2a4f';
    borderColor = '#8effd6';
    textColor = '#fefefe';
    displayText = 'Blood Detector';
    isClickable = true;
  }

  // Draw button
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayText, x + width / 2, y + height / 2);

  ctx.restore();

  // Store hitbox only if clickable
  if (isClickable) {
    gameState.ui.hitboxes.bloodDetectorButton = { x, y, x2: x + width, y2: y + height };
  } else {
    gameState.ui.hitboxes.bloodDetectorButton = null;
  }
};

export const handleBloodDetectorClick = (screenX, screenY) => {
  const hitbox = gameState.ui.hitboxes.bloodDetectorButton;
  if (!hitbox) return false;

  if (screenX >= hitbox.x && screenX <= hitbox.x2 && screenY >= hitbox.y && screenY <= hitbox.y2) {
    addClickRipple((hitbox.x + hitbox.x2) / 2, (hitbox.y + hitbox.y2) / 2, '#8effd6');
    activateBloodDetector();
    return true;
  }

  return false;
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

const drawHealthBar = (ctx) => {
  const fraction = Math.max(0, Math.min(1, getHealthFraction()));
  const x = padding;
  const y = padding;
  drawBackground(ctx, x, y);
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(x, y, barWidth * fraction, barHeight);
  drawOutline(ctx, x, y);
  ctx.fillStyle = '#f4f9ff';
  ctx.font = '16px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HP', x + barWidth + 8, y + barHeight / 2);
};

export const renderHud = (ctx) => {
  drawHealthBar(ctx);
  drawCredits(ctx);
  drawTaserStatus(ctx);
  drawHackStatus(ctx);
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
  drawUpgradeButton(ctx);
  drawBloodDetector(ctx);
};
