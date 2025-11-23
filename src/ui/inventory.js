import { gameState } from '../state/gameState.js';
import { syncOxygenState } from '../movement/oxygenSystem.js';
import { tryHandleInteractionClick } from '../interactions/interactionSystem.js';
import { handleContainerClick } from './containerMenu.js';
import { handleVendingClick } from './vendingMenu.js';
import * as journalUi from './journal.js';
import { handleGameOverClick } from './gameOver.js';
import { handleHackingClick } from './hacking.js';
import { applyEfficientHackToLocks } from '../hacking/hackingState.js';
import { handleLockpickClick, handleLockpickPointerDown, handleLockpickPointerUp } from './lockpick.js';
import { handleAccusationClick } from './accusation.js';
import { applyFastLockpickToLocks } from '../lockpick/lockpickSystem.js';
import { handleUpgradeButtonClick, handleUpgradesClick } from './upgrades.js';
import { handleWeaponTestingClick } from './weaponTesting.js';
import { handleDoorTerminalClick } from './doorTerminalOverlay.js';
import { OverlayId, openOverlay, closeOverlay, toggleOverlay, isOverlayActive } from '../state/overlayManager.js';

const hitboxes = () => gameState.ui.hitboxes;
const swapState = () => gameState.ui.inventorySwap;
const isInventorySwapActive = () => swapState().active;

const clearInventorySwapState = () => {
  const swap = swapState();
  swap.active = false;
  swap.incomingItem = null;
  swap.sourcePropId = null;
  swap.sourceItemId = null;
  swap.previousOverlay = null;
};

const restoreInventoryVisibility = () => {
  const swap = swapState();
  if (swap.previousOverlay) {
    openOverlay(swap.previousOverlay);
  } else {
    closeOverlay();
  }
};

const cancelInventorySwapPrompt = () => {
  if (!isInventorySwapActive()) return;
  restoreInventoryVisibility();
  clearInventorySwapState();
  hitboxes().inventoryCancelButton = null;
};

const findPropById = (propId) => (
  propId ? gameState.props.find((prop) => prop.id === propId) ?? null : null
);

const finalizeInventorySwapAtIndex = (slotIndex) => {
  const swap = swapState();
  const prop = findPropById(swap.sourcePropId);
  if (!prop) {
    cancelInventorySwapPrompt();
    return false;
  }
  const pendingIndex = prop.contents.findIndex((entry) => entry.id === swap.sourceItemId);
  if (pendingIndex === -1) {
    cancelInventorySwapPrompt();
    return false;
  }
  const outgoingItem = gameState.inventory[slotIndex];
  if (!outgoingItem) {
    cancelInventorySwapPrompt();
    return false;
  }
  const incomingItem = prop.contents[pendingIndex];
  prop.contents[pendingIndex] = outgoingItem;
  gameState.inventory[slotIndex] = incomingItem;
  restoreInventoryVisibility();
  clearInventorySwapState();
  hitboxes().inventoryCancelButton = null;
  return true;
};

const pointInRect = (rect, x, y) => (
  rect && x >= rect.x && x <= rect.x2 && y >= rect.y && y <= rect.y2
);

const handleInventorySwapCancelClick = (screenX, screenY) => {
  if (!isInventorySwapActive()) return false;
  const rect = hitboxes().inventoryCancelButton;
  if (pointInRect(rect, screenX, screenY)) {
    cancelInventorySwapPrompt();
    return true;
  }
  return false;
};

const applyItemEffect = (entry) => {
  if (!entry.effect) return false;
  const player = gameState.player;
  if (entry.effect.type === 'stamina') {
    const stamina = player.stamina;
    stamina.current = Math.min(stamina.max, stamina.current + stamina.max * entry.effect.amount);
    stamina.drainTimer = 0;
    return true;
  }
  if (entry.effect.type === 'health') {
    const health = player.health;
    health.current = Math.min(health.max, health.current + entry.effect.amount);
    return true;
  }
  if (entry.effect.type === 'oxygen') {
    const oxygen = player.oxygen;
    const addedSeconds = gameState.config.oxygen.depletionSeconds * entry.effect.amount;
    oxygen.secondsRemaining = Math.min(
      gameState.config.oxygen.depletionSeconds,
      oxygen.secondsRemaining + addedSeconds
    );
    syncOxygenState();
    return true;
  }
  if (entry.effect.type === 'efficient_hack') {
    if (player.upgrades.efficientHack) return false;
    player.upgrades.efficientHack = true;
    applyEfficientHackToLocks();
    return true;
  }
  if (entry.effect.type === 'fast_lockpick') {
    if (player.upgrades.fastLockpick) return false;
    player.upgrades.fastLockpick = true;
    applyFastLockpickToLocks();
    return true;
  }
  if (entry.effect.type === 'skeleton_key') {
    if (player.upgrades.skeletonKey) return false;
    player.upgrades.skeletonKey = true;
    return true;
  }
  if (entry.effect.type === 'master_virus') {
    if (player.upgrades.masterVirus) return false;
    player.upgrades.masterVirus = true;
    return true;
  }
  return false;
};

const handleInventorySelection = (screenX, screenY) => {
  if (!isOverlayActive(OverlayId.INVENTORY) && !isInventorySwapActive()) return false;
  const slots = gameState.ui.hitboxes.inventorySlots;
  const hit = slots.find((slot) => (
    screenX >= slot.x &&
    screenX <= slot.x + slot.width &&
    screenY >= slot.y &&
    screenY <= slot.y + slot.height
  ));
  if (!hit) return false;
  const entry = gameState.inventory[hit.index];
  if (!entry) return false;
  if (isInventorySwapActive()) {
    return finalizeInventorySwapAtIndex(hit.index);
  }
  if (!applyItemEffect(entry)) return false;
  gameState.inventory.splice(hit.index, 1);
  return true;
};

const getCanvasCoords = (canvas, event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const screenX = (event.clientX - rect.left) * scaleX;
  const screenY = (event.clientY - rect.top) * scaleY;
  return {
    screenX,
    screenY,
    worldX: screenX + gameState.camera.x,
    worldY: screenY + gameState.camera.y
  };
};

const handleCanvasClick = (canvas, event) => {
  const { screenX, screenY, worldX, worldY } = getCanvasCoords(canvas, event);
  if (isInventorySwapActive()) {
    if (handleInventorySwapCancelClick(screenX, screenY)) return;
    if (handleInventorySelection(screenX, screenY)) return;
    return;
  }
  if (handleHackingClick(screenX, screenY)) return;
  if (handleLockpickClick(screenX, screenY)) return;
  if (handleUpgradesClick(screenX, screenY)) return;
  if (handleUpgradeButtonClick(screenX, screenY)) return;
  if (handleAccusationClick(screenX, screenY)) return;
  if (handleWeaponTestingClick(screenX, screenY)) return;
  if (handleDoorTerminalClick(screenX, screenY)) return;
  if (tryHandleInteractionClick(worldX, worldY)) return;
  if (journalUi.handleJournalClick && journalUi.handleJournalClick(screenX, screenY)) return;
  if (handleVendingClick(screenX, screenY)) return;
  if (handleContainerClick(screenX, screenY)) return;
  if (handleGameOverClick(screenX, screenY)) return;
  handleInventorySelection(screenX, screenY);
};

const handlePointerDown = (canvas, event) => {
  if (isInventorySwapActive()) {
    event.preventDefault();
    return;
  }
  const { screenX, screenY } = getCanvasCoords(canvas, event);
  if (handleLockpickPointerDown(screenX, screenY)) {
    event.preventDefault();
  }
};

const handlePointerUp = () => {
  handleLockpickPointerUp();
};

export const registerInventoryInput = (canvas) => {
  canvas.addEventListener('click', (event) => handleCanvasClick(canvas, event));
  canvas.addEventListener('mousedown', (event) => handlePointerDown(canvas, event));
  window.addEventListener('mouseup', handlePointerUp);
};

export const handleInventoryToggle = (key) => {
  if (key !== 'i') return;
  if (isInventorySwapActive()) return;
  toggleOverlay(OverlayId.INVENTORY);
};

const drawBackground = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 10, 31, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.6;
  const height = gameState.config.canvasHeight * 0.6;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 24, 48, 0.9)';
  ctx.strokeStyle = '#4f7bd9';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const drawHeader = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '32px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Inventory', panel.x + 32, panel.y + 24);
  ctx.restore();
};

const drawCapacity = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const text = `${gameState.inventory.length}/${gameState.config.inventorySlots} slots`;
  ctx.fillText(text, panel.x + 32, panel.y + 60);
  ctx.restore();
};

const drawItems = (ctx, panel) => {
  const entries = gameState.inventory;
  const slots = hitboxes().inventorySlots;
  slots.length = 0;
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (entries.length === 0) {
    ctx.fillText('No items collected.', panel.x + 32, panel.y + 90);
    ctx.restore();
    return;
  }
  entries.forEach((entry, index) => {
    const lineY = panel.y + 90 + index * 36;
    ctx.fillText(`${index + 1}. ${entry.label}`, panel.x + 32, lineY);
    slots.push({
      index,
      x: panel.x + 32,
      y: lineY,
      width: panel.width - 64,
      height: 32
    });
  });
  ctx.restore();
};

const drawSwapPrompt = (ctx, panel) => {
  const swap = swapState();
  if (!swap.active) {
    hitboxes().inventoryCancelButton = null;
    return;
  }
  const label = swap.incomingItem?.label || 'this item';
  const message = `Inventory full. Select an item to swap for ${label}.`;
  ctx.save();
  ctx.fillStyle = '#ffb199';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(message, panel.x + 32, panel.y + panel.height - 120);
  ctx.restore();
  const buttonWidth = 220;
  const buttonHeight = 40;
  const x = panel.x + (panel.width - buttonWidth) / 2;
  const y = panel.y + panel.height - buttonHeight - 36;
  ctx.save();
  ctx.fillStyle = '#3a0f19';
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, buttonWidth, buttonHeight);
  ctx.strokeRect(x, y, buttonWidth, buttonHeight);
  ctx.fillStyle = '#fefefe';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Do Not Take', x + buttonWidth / 2, y + buttonHeight / 2);
  ctx.restore();
  hitboxes().inventoryCancelButton = { x, y, x2: x + buttonWidth, y2: y + buttonHeight };
};

export const renderInventory = (ctx) => {
  if (!isOverlayActive(OverlayId.INVENTORY) && !isInventorySwapActive()) {
    hitboxes().inventorySlots.length = 0;
    hitboxes().inventoryCancelButton = null;
    return;
  }
  drawBackground(ctx);
  const panel = drawPanel(ctx);
  drawHeader(ctx, panel);
  drawCapacity(ctx, panel);
  drawItems(ctx, panel);
  drawSwapPrompt(ctx, panel);
};
