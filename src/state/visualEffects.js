export const visualEffectsState = Object.seal({
  floatingText: [],   // {x, y, text, color, life, maxLife, velocityY}
  clickRipples: []    // {x, y, radius, maxRadius, color, life, maxLife}
});

// Floating text configuration
const FLOAT_DURATION = 1.2;  // seconds
const FLOAT_SPEED = -40;     // pixels per second (negative = upward)

// Click ripple configuration
const RIPPLE_DURATION = 0.4;  // seconds
const RIPPLE_MAX_RADIUS = 40; // pixels

export const addFloatingText = (x, y, text, color = '#ffd24a') => {
  visualEffectsState.floatingText.push({
    x,
    y,
    text,
    color,
    life: FLOAT_DURATION,
    maxLife: FLOAT_DURATION,
    velocityY: FLOAT_SPEED
  });
};

export const addClickRipple = (x, y, color = '#8effd6') => {
  visualEffectsState.clickRipples.push({
    x,
    y,
    radius: 0,
    maxRadius: RIPPLE_MAX_RADIUS,
    color,
    life: RIPPLE_DURATION,
    maxLife: RIPPLE_DURATION
  });
};

export const updateVisualEffects = (deltaSeconds) => {
  // Update floating text
  for (let i = visualEffectsState.floatingText.length - 1; i >= 0; i--) {
    const floater = visualEffectsState.floatingText[i];
    floater.life -= deltaSeconds;
    floater.y += floater.velocityY * deltaSeconds;

    if (floater.life <= 0) {
      visualEffectsState.floatingText.splice(i, 1);
    }
  }

  // Update click ripples
  for (let i = visualEffectsState.clickRipples.length - 1; i >= 0; i--) {
    const ripple = visualEffectsState.clickRipples[i];
    ripple.life -= deltaSeconds;

    // Grow radius over lifetime
    const progress = 1 - (ripple.life / ripple.maxLife);
    ripple.radius = ripple.maxRadius * progress;

    if (ripple.life <= 0) {
      visualEffectsState.clickRipples.splice(i, 1);
    }
  }
};

export const clearVisualEffects = () => {
  visualEffectsState.floatingText.length = 0;
  visualEffectsState.clickRipples.length = 0;
};
