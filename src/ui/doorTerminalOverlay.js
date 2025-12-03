import { gameState } from '../state/gameState.js';
import { OverlayId, closeOverlay, isOverlayActive, openOverlay } from '../state/overlayManager.js';
import { addClickRipple } from '../state/visualEffects.js';

const clearHitboxes = () => {
  gameState.ui.doorTerminal.closeButton = null;
  gameState.ui.doorLog.viewLogButton = null;
};

const getRoomName = (roomId) => {
  const room = gameState.map.rooms.find((r) => r.id === roomId);
  if (!room) return 'UNKNOWN';
  return room.name ? room.name.toUpperCase() : roomId.toUpperCase().replace(/_/g, ' ');
};

const formatTraitValue = (value) => {
  return value ? value.toUpperCase() : 'UNKNOWN';
};

export const handleDoorTerminalClick = (screenX, screenY) => {
  if (!isOverlayActive(OverlayId.DOOR_TERMINAL)) return false;

  const closeHitbox = gameState.ui.doorTerminal.closeButton;
  if (closeHitbox && screenX >= closeHitbox.x && screenX <= closeHitbox.x2 && screenY >= closeHitbox.y && screenY <= closeHitbox.y2) {
    addClickRipple((closeHitbox.x + closeHitbox.x2) / 2, (closeHitbox.y + closeHitbox.y2) / 2, '#ff6b6b');
    gameState.ui.doorTerminal.activeRoomId = null;
    closeOverlay();
    return true;
  }

  const viewLogHitbox = gameState.ui.doorLog.viewLogButton;
  if (viewLogHitbox && screenX >= viewLogHitbox.x && screenX <= viewLogHitbox.x2 && screenY >= viewLogHitbox.y && screenY <= viewLogHitbox.y2) {
    addClickRipple((viewLogHitbox.x + viewLogHitbox.x2) / 2, (viewLogHitbox.y + viewLogHitbox.y2) / 2, '#8effd6');
    const roomId = gameState.ui.doorTerminal.activeRoomId;
    gameState.ui.doorLog.activeRoomId = roomId;
    openOverlay(OverlayId.DOOR_LOG);
    return true;
  }

  return false;
};

const drawBackground = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 20, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.35;
  const height = gameState.config.canvasHeight * 0.4;
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
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#8effd6';
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = '#8effd6';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', x + size / 2, y + size / 2);
  ctx.restore();
  gameState.ui.doorTerminal.closeButton = { x, y, x2: x + size, y2: y + size };
};

const drawTitle = (ctx, panel, roomName) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(roomName, panel.x + panel.width / 2, panel.y + 16);
  ctx.restore();
};

const drawReadings = (ctx, panel, temperature, humidity) => {
  ctx.save();
  ctx.fillStyle = '#fefefe';
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const startY = panel.y + 80;
  const lineHeight = 40;

  ctx.fillStyle = '#8effd6';
  ctx.fillText('TEMPERATURE:', panel.x + 30, startY);
  ctx.fillStyle = '#fefefe';
  ctx.fillText(formatTraitValue(temperature), panel.x + 30, startY + lineHeight);

  ctx.fillStyle = '#8effd6';
  ctx.fillText('HUMIDITY:', panel.x + 30, startY + lineHeight * 2.5);
  ctx.fillStyle = '#fefefe';
  ctx.fillText(formatTraitValue(humidity), panel.x + 30, startY + lineHeight * 3.5);

  ctx.restore();
};

const drawViewLogButton = (ctx, panel) => {
  const buttonWidth = 200;
  const buttonHeight = 40;
  const x = panel.x + (panel.width - buttonWidth) / 2;
  const y = panel.y + panel.height - buttonHeight - 20;

  ctx.save();
  ctx.fillStyle = '#1f2a4f';
  ctx.strokeStyle = '#8effd6';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, buttonWidth, buttonHeight);
  ctx.strokeRect(x, y, buttonWidth, buttonHeight);

  ctx.fillStyle = '#fefefe';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('View Door Log', x + buttonWidth / 2, y + buttonHeight / 2);
  ctx.restore();

  gameState.ui.doorLog.viewLogButton = { x, y, x2: x + buttonWidth, y2: y + buttonHeight };
};

export const renderDoorTerminalOverlay = (ctx) => {
  if (!isOverlayActive(OverlayId.DOOR_TERMINAL)) {
    clearHitboxes();
    return;
  }

  const roomId = gameState.ui.doorTerminal.activeRoomId;
  if (!roomId) {
    clearHitboxes();
    closeOverlay();
    return;
  }

  const roomTraits = gameState.case.roomTraits[roomId];
  if (!roomTraits) {
    clearHitboxes();
    closeOverlay();
    return;
  }

  const roomName = getRoomName(roomId);

  drawBackground(ctx);
  const panel = drawPanel(ctx);
  drawCloseButton(ctx, panel);
  drawTitle(ctx, panel, roomName);
  drawReadings(ctx, panel, roomTraits.temperature, roomTraits.humidity);
  drawViewLogButton(ctx, panel);
};
