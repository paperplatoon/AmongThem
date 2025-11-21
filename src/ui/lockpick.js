import { gameState } from '../state/gameState.js';
import { getLockpickById, combinationLength, lockpickDirectionForStep } from '../state/lockpickState.js';

const floorDigit = (value) => Math.floor((((value % 10) + 10) % 10));

const hitboxes = () => gameState.ui.hitboxes.lockpick;

const clearHitboxes = () => {
  const box = hitboxes();
  if (!box) return;
  box.closeButton = null;
  box.bypassButton = null;
  box.leftArrow = null;
  box.rightArrow = null;
};

const releaseInputs = () => {
  gameState.lockpick.leftHeld = false;
  gameState.lockpick.rightHeld = false;
};

const closeOverlay = () => {
  releaseInputs();
  gameState.lockpick.activeId = null;
  gameState.ui.openLockpickId = null;
  clearHitboxes();
};

export const handleLockpickPointerDown = (screenX, screenY) => {
  if (!gameState.ui.openLockpickId) return false;
  const box = hitboxes();
  const pointInRect = (rect) => (
    rect && screenX >= rect.x && screenX <= rect.x2 && screenY >= rect.y && screenY <= rect.y2
  );
  if (box.leftArrow && pointInRect(box.leftArrow)) {
    gameState.lockpick.leftHeld = true;
    gameState.lockpick.rightHeld = false;
    return true;
  }
  if (box.rightArrow && pointInRect(box.rightArrow)) {
    gameState.lockpick.rightHeld = true;
    gameState.lockpick.leftHeld = false;
    return true;
  }
  return false;
};

export const handleLockpickPointerUp = () => {
  if (!gameState.ui.openLockpickId) return false;
  releaseInputs();
  return false;
};

export const handleLockpickClick = (screenX, screenY) => {
  if (!gameState.ui.openLockpickId) return false;
  const box = hitboxes();
  const pointInRect = (rect) => (
    rect && screenX >= rect.x && screenX <= rect.x2 && screenY >= rect.y && screenY <= rect.y2
  );
  if (box.closeButton && pointInRect(box.closeButton)) {
    closeOverlay();
    return true;
  }
  return false;
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 18, 0.78)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.78;
  const height = gameState.config.canvasHeight * 0.78;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(12, 18, 38, 0.95)';
  ctx.strokeStyle = '#6d8cff';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const drawStatusText = (ctx, panel, lock) => {
  const nextIndex = Math.min(lock.attemptDigits.length, combinationLength - 1);
  const direction = lock.isUnlocked ? null : lockpickDirectionForStep(nextIndex).toUpperCase();
  const status = lock.isUnlocked ? 'LOCK OPEN' : `NEXT TURN: ${direction}`;
  ctx.save();
  ctx.fillStyle = lock.isUnlocked ? '#8effd6' : '#c5d8ff';
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(status, panel.x + 24, panel.y + 32);
  if (lock.feedback?.message) {
    ctx.fillStyle = '#ff8b5f';
    ctx.fillText(lock.feedback.message.toUpperCase(), panel.x + 24, panel.y + 62);
  }
  ctx.restore();
};

const drawCloseIcon = (ctx, panel) => {
  const size = 28;
  const x = panel.x + panel.width - size - 18;
  const y = panel.y + 24;
  ctx.save();
  ctx.fillStyle = '#3a0f19';
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, size, size);
  ctx.strokeRect(x, y, size, size);
  ctx.strokeStyle = '#fefefe';
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 6);
  ctx.lineTo(x + size - 6, y + size - 6);
  ctx.moveTo(x + size - 6, y + 6);
  ctx.lineTo(x + 6, y + size - 6);
  ctx.stroke();
  ctx.restore();
  hitboxes().closeButton = { x, y, x2: x + size, y2: y + size };
};

const drawRows = (ctx, panel, lock) => {
  const topY = panel.y + 110;
  const bottomY = topY + 70;
  const boxWidth = 48;
  const gap = 12;
  const startX = panel.x + (panel.width - (boxWidth * combinationLength + gap * (combinationLength - 1))) / 2;
  ctx.save();
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 2;
  for (let i = 0; i < combinationLength; i += 1) {
    const x = startX + i * (boxWidth + gap);
    ctx.strokeStyle = '#4f7bd9';
    ctx.fillStyle = '#101935';
    ctx.fillRect(x, topY, boxWidth, boxWidth);
    ctx.strokeRect(x, topY, boxWidth, boxWidth);
    const value = lock.discoveredDigits[i] != null ? lock.discoveredDigits[i] : '?';
    ctx.fillStyle = '#c5d8ff';
    ctx.fillText(value, x + boxWidth / 2, topY + boxWidth / 2);

    ctx.strokeStyle = '#384867';
    ctx.fillStyle = '#070c1a';
    ctx.fillRect(x, bottomY, boxWidth, boxWidth);
    ctx.strokeRect(x, bottomY, boxWidth, boxWidth);
    const attempt = lock.attemptDigits[i];
    ctx.fillStyle = attempt != null ? '#8effd6' : '#495b80';
    ctx.fillText(attempt != null ? attempt : '-', x + boxWidth / 2, bottomY + boxWidth / 2);
  }
  ctx.restore();
};

const drawDial = (ctx, panel, lock) => {
  const radius = Math.min(panel.width, panel.height) * 0.27;
  const centerX = panel.x + panel.width / 2;
  const centerY = panel.y + panel.height * 0.68;
  ctx.save();
  ctx.fillStyle = '#0d1224';
  ctx.strokeStyle = '#4f7bd9';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * (radius - 24);
    const y = centerY + Math.sin(angle) * (radius - 24);
    ctx.fillText(i.toString(), x, y);
  }
  ctx.restore();

  const dialValue = lock.displayDialValue ?? lock.dialValue;
  const pointerAngle = (dialValue / 10) * Math.PI * 2 - Math.PI / 2;
  ctx.save();
  ctx.strokeStyle = '#fefefe';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + Math.cos(pointerAngle) * (radius - 6), centerY + Math.sin(pointerAngle) * (radius - 6));
  ctx.stroke();
  ctx.restore();

  const targetDigit = lock.combination[Math.min(lock.attemptDigits.length, combinationLength - 1)];
  const ledOn = lock.isUnlocked || (targetDigit != null && floorDigit(dialValue) === targetDigit);
  ctx.save();
  ctx.fillStyle = ledOn ? '#ff4f4f' : '#3b1d1d';
  ctx.beginPath();
  ctx.arc(centerX, centerY - radius - 18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawControls = (ctx, panel, lock) => {
  hitboxes().bypassButton = null;
  const arrowWidth = 110;
  const arrowHeight = 80;
  const arrowsY = panel.y + panel.height * 0.6;
  const leftX = panel.x + 36;
  const rightX = panel.x + panel.width - arrowWidth - 36;
  const nextDir = lockpickDirectionForStep(lock.attemptDigits.length);
  const drawArrow = (x, label, active, highlight) => {
    ctx.save();
    const baseFill = highlight ? '#193760' : '#11182c';
    ctx.fillStyle = active ? '#1f4d3f' : baseFill;
    ctx.strokeStyle = active ? '#3dd17a' : highlight ? '#8effd6' : '#4f7bd9';
    ctx.lineWidth = 2;
    ctx.fillRect(x, arrowsY, arrowWidth, arrowHeight);
    ctx.strokeRect(x, arrowsY, arrowWidth, arrowHeight);
    ctx.fillStyle = '#c5d8ff';
    ctx.font = '26px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + arrowWidth / 2, arrowsY + arrowHeight / 2);
    ctx.restore();
  };
  drawArrow(leftX, '◀', gameState.lockpick.leftHeld, nextDir === 'left');
  drawArrow(rightX, '▶', gameState.lockpick.rightHeld, nextDir === 'right');
  hitboxes().leftArrow = { x: leftX, y: arrowsY, x2: leftX + arrowWidth, y2: arrowsY + arrowHeight };
  hitboxes().rightArrow = { x: rightX, y: arrowsY, x2: rightX + arrowWidth, y2: arrowsY + arrowHeight };
};

export const renderLockpick = (ctx) => {
  const lockId = gameState.ui.openLockpickId;
  if (!lockId) {
    clearHitboxes();
    return;
  }
  const lock = getLockpickById(lockId);
  if (!lock) {
    closeOverlay();
    return;
  }
  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawStatusText(ctx, panel, lock);
  drawCloseIcon(ctx, panel);
  drawRows(ctx, panel, lock);
  drawDial(ctx, panel, lock);
  drawControls(ctx, panel, lock);
};
