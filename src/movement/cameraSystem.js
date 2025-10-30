import { gameState } from '../state/gameState.js';

const half = (value) => value / 2;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

const getBounds = (camera) => ({
  minX: 0,
  maxX: gameState.config.worldWidth - camera.width,
  minY: 0,
  maxY: gameState.config.worldHeight - camera.height
});

const clampCamera = (camera) => {
  const bounds = getBounds(camera);
  camera.x = clamp(camera.x, bounds.minX, bounds.maxX);
  camera.y = clamp(camera.y, bounds.minY, bounds.maxY);
};

export const updateCamera = () => {
  const camera = gameState.camera;
  camera.x = gameState.player.x - half(camera.width);
  camera.y = gameState.player.y - half(camera.height);
  clampCamera(camera);
};
