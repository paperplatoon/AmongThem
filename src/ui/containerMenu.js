import { gameState } from '../state/gameState.js';
import { markKeycardKnown, markComputerDiscovered, addEvidenceToJournal, markWeaponCategory } from '../state/journalState.js';
import { handleEvidenceItem } from '../evidence/evidenceHandlers.js';

const hitboxes = () => gameState.ui.hitboxes;

const isInventoryFull = () => (
  gameState.inventory.length >= gameState.config.inventorySlots
);

const clearContainerHitboxes = () => {
  hitboxes().containerSlots.length = 0;
  hitboxes().containerCloseButton = null;
};

const closeContainer = () => {
  gameState.ui.openContainerId = null;
  clearContainerHitboxes();
};

const markPropEmpty = (prop) => {
  prop.isEmpty = true;
  prop.promptText = 'EMPTY';
  prop.searched = true;
};

const collectKeycardItem = (item) => {
  if (!item) return;
  gameState.player.keycards.add(item.lockerId);
  if (item.roleId) markKeycardKnown(item.roleId);
};

const collectCredits = (item) => {
  if (!item || typeof item.amount !== 'number') return;
  gameState.player.money += item.amount;
};

const beginInventorySwap = (prop, item) => {
  if (gameState.ui.inventorySwap.active) return;
  const swap = gameState.ui.inventorySwap;
  swap.active = true;
  swap.incomingItem = item;
  swap.sourcePropId = prop.id;
  swap.sourceItemId = item.id;
  swap.previousInventoryVisible = gameState.ui.showInventory;
  gameState.ui.showInventory = true;
};

export const handleContainerClick = (screenX, screenY) => {
  if (!gameState.ui.openContainerId) return false;
  const closeHitbox = hitboxes().containerCloseButton;
  if (closeHitbox && screenX >= closeHitbox.x && screenX <= closeHitbox.x2 && screenY >= closeHitbox.y && screenY <= closeHitbox.y2) {
    closeContainer();
    return true;
  }
  const hit = hitboxes().containerSlots.find((slot) => screenX >= slot.x && screenX <= slot.x2 && screenY >= slot.y && screenY <= slot.y2);
  if (!hit) return false;
  const prop = gameState.props.find((p) => p.id === gameState.ui.openContainerId);
  if (!prop) return false;
  if (prop.lockpickId && !prop.lockpickUnlocked) {
    gameState.ui.openContainerId = null;
    return true;
  }
  if (!prop.contents.length) {
    markPropEmpty(prop);
    closeContainer();
    return false;
  }
  const item = prop.contents[hit.index];
  if (!item) return false;
  if (prop.type === 'computer' && prop.roomId) markComputerDiscovered(prop.roomId);
  if (item.type === 'keycard') {
    collectKeycardItem(item);
    prop.contents.splice(hit.index, 1);
  } else if (handleEvidenceItem(item)) {
    const targetRole = item.roleId ?? prop.roomId;
    addEvidenceToJournal(targetRole, item);
    if (item.type === 'weapon_category') {
      markWeaponCategory(targetRole, item.label);
    }
    prop.contents.splice(hit.index, 1);
  } else if (item.type === 'credits') {
    collectCredits(item);
    prop.contents.splice(hit.index, 1);
  } else {
    if (isInventoryFull()) {
      beginInventorySwap(prop, item);
      return true;
    }
    gameState.inventory.push(item);
    prop.contents.splice(hit.index, 1);
  }
  if (!prop.contents.length) {
    markPropEmpty(prop);
    closeContainer();
  }
  return true;
};

const drawBackground = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 20, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.4;
  const height = gameState.config.canvasHeight * 0.5;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(18, 28, 54, 0.95)';
  ctx.strokeStyle = '#8effd6';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const drawCloseButton = (ctx, panel) => {
  const size = 24;
  const x = panel.x + panel.width - size - 8;
  const y = panel.y + 8;
  ctx.save();
  ctx.fillStyle = '#2f3e69';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#8effd6';
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = '#8effd6';
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', x + size / 2, y + size / 2);
  ctx.restore();
  hitboxes().containerCloseButton = { x, y, x2: x + size, y2: y + size };
};

const drawTitle = (ctx, panel, label) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, panel.x + 20, panel.y + 16);
  ctx.restore();
};

const drawContents = (ctx, panel, contents) => {
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const slots = hitboxes().containerSlots;
  slots.length = 0;
  contents.forEach((item, index) => {
    const y = panel.y + 64 + index * 32;
    const isCredits = item.type === 'credits';
    ctx.fillStyle = isCredits ? gameState.config.creditsColor : '#8effd6';
    const suffix = isCredits ? ` (+${item.amount})` : '';
    ctx.fillText(`• ${item.label}${suffix}`, panel.x + 20, y);
    slots.push({ x: panel.x + 20, y, x2: panel.x + panel.width - 20, y2: y + 28, index });
  });
  ctx.restore();
};

export const renderContainerMenu = (ctx) => {
  if (!gameState.ui.openContainerId) {
    clearContainerHitboxes();
    return;
  }
  const prop = gameState.props.find((p) => p.id === gameState.ui.openContainerId);
  if (!prop) {
    gameState.ui.openContainerId = null;
    clearContainerHitboxes();
    return;
  }
  if (prop.lockpickId && !prop.lockpickUnlocked) {
    gameState.ui.openContainerId = null;
    clearContainerHitboxes();
    return;
  }
  if (!prop.contents.length) {
    markPropEmpty(prop);
    closeContainer();
    return;
  }
  drawBackground(ctx);
  const panel = drawPanel(ctx);
  drawCloseButton(ctx, panel);
  drawTitle(ctx, panel, `${prop.label}`);
  drawContents(ctx, panel, prop.contents);
};
