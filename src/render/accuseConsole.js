import { gameState } from '../state/gameState.js';

export const renderAccuseConsole = (ctx) => {
  const bridge = gameState.map.rooms.find((room) => room.id === 'bridge');
  if (!bridge) return;
  const centerX = bridge.x + bridge.width / 2;
  const centerY = bridge.y + bridge.height / 2;
  const size = gameState.grid.cellSize * 0.8;
  ctx.save();
  ctx.fillStyle = '#1f2a4f';
  ctx.strokeStyle = '#8effd6';
  ctx.lineWidth = 2;
  ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
  ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
  ctx.fillStyle = '#fefefe';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ACCUSE', centerX, centerY);
  ctx.restore();
  const distance = Math.hypot(gameState.player.x - centerX, gameState.player.y - centerY);
  if (distance <= 100) {
    ctx.save();
    ctx.fillStyle = '#fefefe';
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('CLICK TO ACCUSE', centerX, centerY - size / 2 - 8);
    ctx.restore();
  }
};
