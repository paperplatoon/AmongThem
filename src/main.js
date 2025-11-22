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
//import { handleBodyInteraction } from './body/bodyInteraction.js';
import { updateInteractions } from './interactions/interactionSystem.js';
import { initializeCase, applyCaseObstacles } from './state/caseState.js';
import { updateVillain } from './villain/villainSystem.js';
import { tryFireTaser } from './combat/taserSystem.js';
import { handleHackingKeyInput, isHackingActive, updateHackingSystem, applyEfficientHackToLocks, applyMasterVirusToLocks } from './hacking/hackingState.js';
import { updateLockpickSystem, applyFastLockpickToLocks } from './lockpick/lockpickSystem.js';
import { setTestingModeEnabled, applyTestingModeEffects } from './state/testingMode.js';

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
  //handleBodyInteraction();
  updateMovement(delta);
  updateVillain(delta);
  updateDoors(delta);
  updateCamera();
  updateInteractions();
  updateHackingSystem(delta);
  updateLockpickSystem(delta);
  applyTestingModeEffects();
  renderFrame(ctx);
  requestAnimationFrame((next) => stepFrame(ctx, next));
};

const start = () => {
  gameState.testing = true;
  initializeCase();
  buildSolidMask();
  applyCaseObstacles();
  if (gameState.testing) {
    setTestingModeEnabled(true);
    gameState.player.upgrades.efficientHack = true;
    applyEfficientHackToLocks();
    gameState.player.upgrades.fastLockpick = true;
    applyFastLockpickToLocks();
    applyMasterVirusToLocks();
  }
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  mountCanvas(canvas);
  registerInventoryInput(canvas);
  const handleKeyDown = (key) => {
    if (handleHackingKeyInput(key)) return;
    if (isHackingActive()) return;
    if (gameState.ui.inventorySwap.active) {
      if (key === 'i') handleInventoryToggle(key);
      return;
    }
    handleMinimapToggle(key);
    handleInventoryToggle(key);
    handleJournalToggle(key);
  };
  const handleActionKey = (key) => {
    if (isHackingActive()) return;
    if (key === 't') tryFireTaser();
  };
  bindKeyboard(gameState.pressedKeys, handleKeyDown, handleActionKey);
  requestAnimationFrame((time) => stepFrame(ctx, time));
};

document.addEventListener('DOMContentLoaded', start);
