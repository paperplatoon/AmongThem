import { gameState } from '../state/gameState.js';

export const renderVillain = (ctx) => {
  const villain = gameState.villain;
  if (!villain || villain.x == null || villain.y == null) return;
  ctx.save();
  ctx.fillStyle = villain.state === 'chasePlayer'
    ? '#ff9f43'
    : villain.state === 'lostPlayer'
      ? '#ffce54'
      : '#ff6b6b';
  const noticeDuration = gameState.config.villain.noticeDurationSeconds || 0.3;
  const jumpOffset = villain.state === 'noticePlayer'
    ? Math.sin(Math.min(1, villain.noticeElapsed / noticeDuration) * Math.PI) * gameState.config.villain.noticeJumpHeight
    : 0;
  ctx.beginPath();
  ctx.arc(villain.x, villain.y - jumpOffset, gameState.config.playerRadius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
