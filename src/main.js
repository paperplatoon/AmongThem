import { config } from './state/config.js';
import { gameState } from './state/gameState.js';
import { bindKeyboard } from './input/keyboard.js';
import { updateMovement } from './movement/movementSystem.js';
import { renderFrame } from './render/renderer.js';
import { updateCamera } from './movement/cameraSystem.js';
import { handleMinimapToggle } from './ui/minimap.js';
import { handleInventoryToggle } from './ui/inventory.js';
import { updateDoors } from './doors/doorSystem.js';
import { handleItemPickup } from './items/itemPickup.js';

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;
  canvas.className = 'blueprint-canvas';
  return canvas;
};

const mountCanvas = (canvas) => document.body.appendChild(canvas);

const getDelta = (time) => {
  if (!gameState.lastFrameTime) gameState.lastFrameTime = time;
  const delta = (time - gameState.lastFrameTime) / 1000;
  gameState.lastFrameTime = time;
  return delta;
};

const stepFrame = (ctx, time) => {
  const delta = getDelta(time);
  handleItemPickup();
  updateMovement(delta);
  updateDoors(delta);
  updateCamera();
  renderFrame(ctx);
  requestAnimationFrame((next) => stepFrame(ctx, next));
};

const start = () => {
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  mountCanvas(canvas);
  const handleKeyDown = (key) => {
    handleMinimapToggle(key);
    handleInventoryToggle(key);
  };
  bindKeyboard(gameState.pressedKeys, handleKeyDown);
  requestAnimationFrame((time) => stepFrame(ctx, time));
};

document.addEventListener('DOMContentLoaded', start);
