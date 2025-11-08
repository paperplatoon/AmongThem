import { config } from './state/config.js';
import { gameState } from './state/gameState.js';
import { bindKeyboard } from './input/keyboard.js';
import { updateMovement } from './movement/movementSystem.js';
import { renderFrame } from './render/renderer.js';
import { updateCamera } from './movement/cameraSystem.js';
import { handleMinimapToggle } from './ui/minimap.js';
import { handleInventoryToggle, registerInventoryInput } from './ui/inventory.js';
import { handleJournalToggle } from './ui/journal.js';
import { updateDoors } from './doors/doorSystem.js';
import { buildSolidMask } from './collision/solidMask.js';
import { handleBodyInteraction } from './body/bodyInteraction.js';
import { handleKeycardPickup } from './keycards/keycardPickup.js';
import { updateInteractions } from './interactions/interactionSystem.js';
import { initializeCase, applyCaseObstacles } from './state/caseState.js';

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
  handleBodyInteraction();
  handleKeycardPickup();
  updateMovement(delta);
  updateDoors(delta);
  updateCamera();
  updateInteractions();
  renderFrame(ctx);
  requestAnimationFrame((next) => stepFrame(ctx, next));
};

const start = () => {
  initializeCase();
  buildSolidMask();
  applyCaseObstacles();
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  mountCanvas(canvas);
  registerInventoryInput(canvas);
  const handleKeyDown = (key) => {
    handleMinimapToggle(key);
    handleInventoryToggle(key);
    handleJournalToggle(key);
  };
  bindKeyboard(gameState.pressedKeys, handleKeyDown);
  requestAnimationFrame((time) => stepFrame(ctx, time));
};

document.addEventListener('DOMContentLoaded', start);
