import { gameState } from '../state/gameState.js';

const lerpColor = (colorA, colorB, t) => {
  const toRgb = (hex) => {
    const value = hex.replace('#', '');
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  };
  const from = toRgb(colorA);
  const to = toRgb(colorB);
  const mix = (a, b) => Math.round(a + (b - a) * t);
  const r = mix(from.r, to.r);
  const g = mix(from.g, to.g);
  const b = mix(from.b, to.b);
  return `rgb(${r}, ${g}, ${b})`;
};

const stunFraction = (villain) => {
  if (!villain.stunnedUntil) return 0;
  const now = (gameState.lastFrameTime || 0) / 1000;
  return Math.max(0, Math.min(1, (villain.stunnedUntil - now) / gameState.config.taser.stunSeconds));
};

const villainBaseColor = (villain) => {
  const stun = stunFraction(villain);
  if (stun > 0) {
    const grey = '#777777';
    const normal = villain.state === 'chasePlayer' ? '#ff9f43' : villain.state === 'lostPlayer' ? '#ffce54' : '#ff6b6b';
    return lerpColor(grey, normal, 1 - stun);
  }
  if (villain.noticeFlashTimer > 0 && villain.noticeFlashDuration > 0) {
    const [startColor, endColor] = gameState.config.villain.noticeFlashColors;
    const fraction = 1 - (villain.noticeFlashTimer / villain.noticeFlashDuration);
    const speed = gameState.config.villain.noticeFlashSpeed;
    const wave = Math.sin(fraction * Math.PI * speed) * 0.5 + 0.5;
    return lerpColor(startColor, endColor, wave);
  }
  if (villain.state === 'chasePlayer') return '#ff9f43';
  if (villain.state === 'lostPlayer') return '#ffce54';
  return '#ff6b6b';
};

const noticeJumpOffset = (villain) => {
  if (villain.state !== 'noticePlayer' || villain.noticePhase !== 'hop') return 0;
  const hopDuration = Math.max(0.01, gameState.config.villain.noticeHopDurationSeconds);
  const ratio = Math.min(1, villain.noticeElapsed / hopDuration);
  return Math.sin(ratio * Math.PI) * gameState.config.villain.noticeJumpHeight;
};

export const renderVillain = (ctx) => {
  const villain = gameState.villain;
  if (!villain || villain.x == null || villain.y == null) return;
  ctx.save();
  ctx.fillStyle = villainBaseColor(villain);
  const jumpOffset = noticeJumpOffset(villain);
  ctx.beginPath();
  ctx.arc(villain.x, villain.y - jumpOffset, gameState.config.playerRadius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
