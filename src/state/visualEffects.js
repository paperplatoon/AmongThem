export const visualEffectsState = Object.seal({
  floatingText: [],   // {x, y, text, color, life, maxLife, velocityY}
  clickRipples: [],   // {x, y, radius, maxRadius, color, life, maxLife}
  particles: [],      // {x, y, vx, vy, color, size, life, maxLife, gravity}
  propFlashes: new Map() // propId -> {intensity, maxIntensity, duration}
});

// Floating text configuration
const FLOAT_DURATION = 1.2;  // seconds
const FLOAT_SPEED = -40;     // pixels per second (negative = upward)

// Click ripple configuration
const RIPPLE_DURATION = 0.4;  // seconds
const RIPPLE_MAX_RADIUS = 40; // pixels

// Particle configuration
const PARTICLE_DURATION = 1.0; // seconds
const PARTICLE_GRAVITY = 120;   // pixels per second squared
const PARTICLE_SPEED = 80;      // initial speed

// Prop flash configuration
const FLASH_DURATION = 0.2;     // seconds

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

export const addParticleBurst = (x, y, color = '#8effd6', count = 8) => {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = PARTICLE_SPEED + (Math.random() - 0.5) * 20;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    visualEffectsState.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size: 4 + Math.random() * 2,
      life: PARTICLE_DURATION,
      maxLife: PARTICLE_DURATION,
      gravity: PARTICLE_GRAVITY
    });
  }
};

export const addPropFlash = (propId) => {
  visualEffectsState.propFlashes.set(propId, {
    intensity: 1.0,
    maxIntensity: 1.0,
    duration: FLASH_DURATION
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

  // Update particles
  for (let i = visualEffectsState.particles.length - 1; i >= 0; i--) {
    const particle = visualEffectsState.particles[i];
    particle.life -= deltaSeconds;

    // Apply velocity
    particle.x += particle.vx * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;

    // Apply gravity
    particle.vy += particle.gravity * deltaSeconds;

    if (particle.life <= 0) {
      visualEffectsState.particles.splice(i, 1);
    }
  }

  // Update prop flashes
  for (const [propId, flash] of visualEffectsState.propFlashes.entries()) {
    flash.duration -= deltaSeconds;
    flash.intensity = Math.max(0, flash.duration / FLASH_DURATION);

    if (flash.duration <= 0) {
      visualEffectsState.propFlashes.delete(propId);
    }
  }
};

export const clearVisualEffects = () => {
  visualEffectsState.floatingText.length = 0;
  visualEffectsState.clickRipples.length = 0;
  visualEffectsState.particles.length = 0;
  visualEffectsState.propFlashes.clear();
};

export const getPropFlashIntensity = (propId) => {
  const flash = visualEffectsState.propFlashes.get(propId);
  return flash ? flash.intensity : 0;
};
