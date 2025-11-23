import { gameState } from '../state/gameState.js';
import { OverlayId, closeOverlay, isOverlayActive } from '../state/overlayManager.js';
import { addClickRipple } from '../state/visualEffects.js';

const clearHitboxes = () => {
  gameState.ui.bioData.closeButton = null;
};

const formatTraitValue = (value) => {
  return value ? value.toUpperCase() : 'UNKNOWN';
};

export const handleBioDataClick = (screenX, screenY) => {
  if (!isOverlayActive(OverlayId.BIO_DATA)) return false;

  const closeHitbox = gameState.ui.bioData.closeButton;
  if (closeHitbox && screenX >= closeHitbox.x && screenX <= closeHitbox.x2 && screenY >= closeHitbox.y && screenY <= closeHitbox.y2) {
    addClickRipple((closeHitbox.x + closeHitbox.x2) / 2, (closeHitbox.y + closeHitbox.y2) / 2, '#ff6b6b');
    closeOverlay();
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
  const width = gameState.config.canvasWidth * 0.6;
  const height = gameState.config.canvasHeight * 0.75;
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
  gameState.ui.bioData.closeButton = { x, y, x2: x + size, y2: y + size };
};

const drawTitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#fefefe';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('SUIT BIODATA TERMINAL', panel.x + panel.width / 2, panel.y + 16);
  ctx.restore();
};

const drawSubtitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#2dd4bf';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Last recorded environmental readings', panel.x + panel.width / 2, panel.y + 52);
  ctx.restore();
};

const drawBioDataList = (ctx, panel) => {
  const bioData = gameState.case.npcBioData;
  const entries = gameState.journal.entries;

  ctx.save();
  ctx.font = '18px "Courier New", monospace';
  ctx.textBaseline = 'top';

  const startY = panel.y + 96;
  const rowHeight = 36;
  const leftMargin = panel.x + 30;

  entries.forEach((entry, index) => {
    const y = startY + index * rowHeight;
    const roleId = entry.id;
    const roleName = entry.roleName;
    const data = bioData[roleId];

    // Draw number and role name
    ctx.fillStyle = '#fefefe';
    ctx.textAlign = 'left';
    ctx.fillText(`${index + 1}. ${roleName}:`, leftMargin, y);

    // Draw biodata
    if (data) {
      const dataX = leftMargin + 250;
      ctx.fillStyle = '#2dd4bf';
      const tempText = `TEMP: ${formatTraitValue(data.temperature)}`;
      const humidText = `HUMID: ${formatTraitValue(data.humidity)}`;
      ctx.fillText(`${tempText} | ${humidText}`, dataX, y);
    } else {
      ctx.fillStyle = '#7b84a2';
      ctx.fillText('NO DATA', leftMargin + 250, y);
    }
  });

  ctx.restore();
};

export const renderBioDataOverlay = (ctx) => {
  if (!isOverlayActive(OverlayId.BIO_DATA)) {
    clearHitboxes();
    return;
  }

  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawCloseButton(ctx, panel);
  drawTitle(ctx, panel);
  drawSubtitle(ctx, panel);
  drawBioDataList(ctx, panel);
};
