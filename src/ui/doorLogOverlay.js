import { gameState } from '../state/gameState.js';
import { OverlayId, closeOverlay, isOverlayActive } from '../state/overlayManager.js';
import { addClickRipple } from '../state/visualEffects.js';

const clearHitboxes = () => {
  gameState.ui.doorLog.closeButton = null;
};

const getRoomName = (roomId) => {
  const room = gameState.map.rooms.find((r) => r.id === roomId);
  if (!room) return 'UNKNOWN';
  return room.name ? room.name.toUpperCase() : roomId.toUpperCase().replace(/_/g, ' ');
};

const getRoleName = (roleId) => {
  const role = gameState.config.roles[roleId];
  if (!role) return 'UNKNOWN';
  return role.name || roleId.toUpperCase().replace(/_/g, ' ');
};

export const handleDoorLogClick = (screenX, screenY) => {
  if (!isOverlayActive(OverlayId.DOOR_LOG)) return false;

  const closeHitbox = gameState.ui.doorLog.closeButton;
  if (closeHitbox && screenX >= closeHitbox.x && screenX <= closeHitbox.x2 && screenY >= closeHitbox.y && screenY <= closeHitbox.y2) {
    addClickRipple((closeHitbox.x + closeHitbox.x2) / 2, (closeHitbox.y + closeHitbox.y2) / 2, '#ff6b6b');
    gameState.ui.doorLog.activeRoomId = null;
    closeOverlay();
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
  const width = gameState.config.canvasWidth * 0.6;
  const height = gameState.config.canvasHeight * 0.7;
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
  gameState.ui.doorLog.closeButton = { x, y, x2: x + size, y2: y + size };
};

const drawTitle = (ctx, panel, roomName) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`Door Access Log - ${roomName}`, panel.x + panel.width / 2, panel.y + 16);
  ctx.restore();
};

const drawLogEntries = (ctx, panel, entries) => {
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const startY = panel.y + 70;
  const lineHeight = 32;

  if (!entries || entries.length === 0) {
    ctx.fillText('No entries recorded.', panel.x + 30, startY);
    ctx.restore();
    return;
  }

  entries.forEach((entry, index) => {
    const y = startY + index * lineHeight;
    const roleName = getRoleName(entry.roleId);
    const text = `${entry.time} - ${roleName} entered room`;
    ctx.fillText(text, panel.x + 30, y);
  });

  ctx.restore();
};

export const renderDoorLogOverlay = (ctx) => {
  if (!isOverlayActive(OverlayId.DOOR_LOG)) {
    clearHitboxes();
    return;
  }

  const roomId = gameState.ui.doorLog.activeRoomId;
  if (!roomId) {
    clearHitboxes();
    closeOverlay();
    return;
  }

  const doorLog = gameState.case.doorLogs[roomId];
  if (!doorLog) {
    clearHitboxes();
    closeOverlay();
    return;
  }

  const roomName = getRoomName(roomId);

  drawBackground(ctx);
  const panel = drawPanel(ctx);
  drawCloseButton(ctx, panel);
  drawTitle(ctx, panel, roomName);
  drawLogEntries(ctx, panel, doorLog);
};
