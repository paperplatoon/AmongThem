import { visualEffectsState } from '../state/visualEffects.js';

const drawFloatingText = (ctx) => {
  visualEffectsState.floatingText.forEach((floater) => {
    const alpha = floater.life / floater.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = floater.color;
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text with slight shadow for visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(floater.text, floater.x, floater.y);
    ctx.restore();
  });
};

const drawClickRipples = (ctx) => {
  visualEffectsState.clickRipples.forEach((ripple) => {
    const alpha = ripple.life / ripple.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha * 0.6; // Max 60% opacity
    ctx.strokeStyle = ripple.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
};

export const renderVisualEffects = (ctx) => {
  drawClickRipples(ctx);
  drawFloatingText(ctx);
};
