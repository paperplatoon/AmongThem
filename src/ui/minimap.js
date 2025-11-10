import { gameState } from '../state/gameState.js';

const toggle = () => { gameState.ui.showMinimap = !gameState.ui.showMinimap; };

export const handleMinimapToggle = (key) => { if (key === 'm') toggle(); };

const getScale = () => {
  const widthRatio = gameState.config.canvasWidth / gameState.config.worldWidth;
  const heightRatio = gameState.config.canvasHeight / gameState.config.worldHeight;
  return Math.min(widthRatio, heightRatio) * 0.9;
};

const getOffset = (scale) => ({
  x: (gameState.config.canvasWidth - gameState.config.worldWidth * scale) / 2,
  y: (gameState.config.canvasHeight - gameState.config.worldHeight * scale) / 2
});

const withCanvas = (ctx, scale, offset, draw) => {
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#020a1f';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.translate(offset.x, offset.y);
  ctx.scale(scale, scale);
  draw();
  ctx.restore();
};

const fillRect = (ctx, rect, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
};

const strokeRect = (ctx, rect, color, lineWidth) => {
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
};

const drawMap = (ctx) => {
  const { corridors, shafts, rooms, doors } = gameState.map;
  corridors.forEach((rect) => fillRect(ctx, rect, '#53b2b0'));
  corridors.forEach((room) => strokeRect(ctx, room, '#4f7bd9', 24));
  shafts.forEach((rect) => fillRect(ctx, rect, '#103c80'));
  rooms.forEach((room) => strokeRect(ctx, room, '#4f7bd9', 24));
  doors.forEach((door) => {
    const state = gameState.doorsById[door.id];
    const isOpen = state ? state.isOpen : false;
    fillRect(ctx, door, isOpen ? '#8effd6' : '#4fc3f7');
  });
};

const drawPlayer = (ctx) => {
  ctx.fillStyle = '#f4f9ff';
  ctx.beginPath();
  ctx.arc(gameState.player.x, gameState.player.y, 36, 0, Math.PI * 2);
  ctx.fill();
};

export const renderMinimap = (ctx) => {
  if (!gameState.ui.showMinimap) return;
  const scale = getScale();
  const offset = getOffset(scale);
  withCanvas(ctx, scale, offset, () => {
    drawMap(ctx);
    drawPlayer(ctx);
  });
};
