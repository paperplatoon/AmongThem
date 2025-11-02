import { gameState } from '../state/gameState.js';
import { syncOxygenState } from '../movement/oxygenSystem.js';
import { tryHandleInteractionClick } from '../interactions/interactionSystem.js';

const slotHitboxes = [];

const applyItemEffect = (entry) => {
  if (!entry.effect) return false;
  const player = gameState.player;
  if (entry.effect.type === 'stamina') {
    const stamina = player.stamina;
    stamina.current = Math.min(stamina.max, stamina.current + stamina.max * entry.effect.amount);
    stamina.drainTimer = 0;
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
  return false;
};

const handleInventorySelection = (screenX, screenY) => {
  if (!gameState.ui.showInventory) return false;
  const hit = slotHitboxes.find((slot) => (
    screenX >= slot.x &&
    screenX <= slot.x + slot.width &&
    screenY >= slot.y &&
    screenY <= slot.y + slot.height
  ));
  if (!hit) return false;
  const entry = gameState.inventory[hit.index];
  if (!entry) return false;
  if (!applyItemEffect(entry)) return false;
  gameState.inventory.splice(hit.index, 1);
  return true;
};

const handleCanvasClick = (canvas, event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const screenX = (event.clientX - rect.left) * scaleX;
  const screenY = (event.clientY - rect.top) * scaleY;
  const worldX = screenX + gameState.camera.x;
  const worldY = screenY + gameState.camera.y;
  if (tryHandleInteractionClick(worldX, worldY)) return;
  handleInventorySelection(screenX, screenY);
};

export const registerInventoryInput = (canvas) => {
  canvas.addEventListener('click', (event) => handleCanvasClick(canvas, event));
};

const toggle = () => { gameState.ui.showInventory = !gameState.ui.showInventory; };

export const handleInventoryToggle = (key) => {
  if (key === 'i') toggle();
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

const drawItems = (ctx, panel) => {
  const entries = gameState.inventory;
  slotHitboxes.length = 0;
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (entries.length === 0) {
    ctx.fillText('No items collected.', panel.x + 32, panel.y + 80);
    ctx.restore();
    return;
  }
  entries.forEach((entry, index) => {
    const lineY = panel.y + 80 + index * 36;
    ctx.fillText(`${index + 1}. ${entry.label}`, panel.x + 32, lineY);
    slotHitboxes.push({
      index,
      x: panel.x + 32,
      y: lineY,
      width: panel.width - 64,
      height: 32
    });
  });
  ctx.restore();
};

export const renderInventory = (ctx) => {
  if (!gameState.ui.showInventory) return;
  drawBackground(ctx);
  const panel = drawPanel(ctx);
  drawHeader(ctx, panel);
  drawItems(ctx, panel);
};
