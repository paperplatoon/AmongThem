import { gameState } from '../state/gameState.js';
const hitboxes = () => gameState.ui.hitboxes.accusation;

const clearHitboxes = () => {
  const box = hitboxes();
  if (!box) return;
  box.roleButtons.length = 0;
  box.closeButton = null;
};

const closeOverlay = () => {
  gameState.accusation.active = false;
  gameState.ui.openAccusation = false;
  gameState.accusation.result = 'idle';
  clearHitboxes();
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 18, 0.8)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.7;
  const height = gameState.config.canvasHeight * 0.7;
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

const drawTitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#fefefe';
  ctx.font = '32px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Accuse a Suspect', panel.x + panel.width / 2, panel.y + 16);
  ctx.restore();
};

const drawWarning = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#ff8b5f';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Click a role to accuse them. If wrong, you lose the investigation.', panel.x + panel.width / 2, panel.y + 60);
  ctx.restore();
};

const drawRoleButtons = (ctx, panel) => {
  const options = Object.keys(gameState.config.roles);
  const columns = 2;
  const buttonWidth = panel.width / columns - 40;
  const buttonHeight = 56;
  const startX = panel.x + 24;
  const startY = panel.y + 110;
  const spacingY = 16;
  hitboxes().roleButtons.length = 0;
  ctx.save();
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  options.forEach((roleId, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + col * (buttonWidth + 32);
    const y = startY + row * (buttonHeight + spacingY);
    ctx.fillStyle = '#162447';
    ctx.strokeStyle = '#6d8cff';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, buttonWidth, buttonHeight);
    ctx.strokeRect(x, y, buttonWidth, buttonHeight);
    ctx.fillStyle = '#fefefe';
    ctx.fillText(gameState.config.roles[roleId].name, x + buttonWidth / 2, y + buttonHeight / 2);
    hitboxes().roleButtons.push({ roleId, x, y, x2: x + buttonWidth, y2: y + buttonHeight });
  });
  ctx.restore();
};

const drawResult = (ctx, panel) => {
  const isWin = gameState.accusation.result === 'win';
  const message = isWin ? 'Correct – You solved the case!' : 'Wrong accusation – Investigation failed.';
  ctx.save();
  ctx.fillStyle = isWin ? '#8effd6' : '#ff8b5f';
  ctx.font = '24px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, panel.x + panel.width / 2, panel.y + panel.height / 2 - 20);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#1c2742';
  ctx.strokeStyle = '#c5d8ff';
  ctx.lineWidth = 2;
  const buttonWidth = 200;
  const buttonHeight = 48;
  const x = panel.x + (panel.width - buttonWidth) / 2;
  const y = panel.y + panel.height / 2 + 40;
  ctx.fillRect(x, y, buttonWidth, buttonHeight);
  ctx.strokeRect(x, y, buttonWidth, buttonHeight);
  ctx.fillStyle = '#c5d8ff';
  ctx.fillText('New Investigation', x + buttonWidth / 2, y + buttonHeight / 2);
  ctx.restore();
  hitboxes().closeButton = { x, y, x2: x + buttonWidth, y2: y + buttonHeight };
};

export const handleAccusationClick = (screenX, screenY) => {
  if (!gameState.ui.openAccusation) return false;
  if (gameState.accusation.result !== 'selecting') {
    const closeHit = hitboxes().closeButton;
    if (closeHit && screenX >= closeHit.x && screenX <= closeHit.x2 && screenY >= closeHit.y && screenY <= closeHit.y2) {
      window.location.reload();
      return true;
    }
    return true;
  }
  const roleHit = hitboxes().roleButtons.find((button) => (
    screenX >= button.x && screenX <= button.x2 && screenY >= button.y && screenY <= button.y2
  ));
  if (!roleHit) return false;
  resolveAccusation(roleHit.roleId);
  return true;
};

const resolveAccusation = (roleId) => {
  const killerRole = gameState.case.killer?.roleKey;
  if (!killerRole) return;
  if (roleId === killerRole) {
    gameState.accusation.result = 'win';
  } else {
    gameState.accusation.result = 'lose';
  }
};

export const renderAccusation = (ctx) => {
  if (!gameState.ui.openAccusation) {
    clearHitboxes();
    return;
  }
  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawTitle(ctx, panel);
  if (gameState.accusation.result === 'selecting') {
    drawWarning(ctx, panel);
    drawRoleButtons(ctx, panel);
  } else {
    drawResult(ctx, panel);
  }
};
