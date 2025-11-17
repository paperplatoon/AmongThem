import { gameState } from '../state/gameState.js';
import { distanceBetween } from '../utils/geometry.js';
import { syncOxygenState } from '../movement/oxygenSystem.js';
import { markVictimIdentified, markDeskDiscovered } from '../state/journalState.js';
import { collectBodySample } from '../body/bodyInteraction.js';
import { resetVillainLockdown } from '../villain/villainSystem.js';
import { cellToWorldCenter } from '../state/gridState.js';

const scannerRange = 96;
const propRange = 88;
const lockedPrompt = 'LOCKED - KEYCARD REQUIRED';

const hasMedicalSample = () => (
  gameState.inventory.some((item) => item.type === 'medical_sample')
);

const removeMedicalSample = () => {
  const index = gameState.inventory.findIndex((item) => item.type === 'medical_sample');
  if (index >= 0) gameState.inventory.splice(index, 1);
};

const applyScannerResults = () => {
  const pending = gameState.case.pending;
  if (!pending) return;
  gameState.case.identified = true;
  gameState.case.victimName = pending.victimName;
  gameState.case.victimOccupation = pending.victimOccupation;
  gameState.case.methodCategory = pending.methodCategory;
  gameState.case.timeWindow = pending.timeWindow;
  gameState.case.pending = null;
  markVictimIdentified(gameState.case.victim?.roleKey);
};

const makeScannerZone = () => {
  const size = gameState.grid.cellSize;
  return {
    id: 'scanner',
    x: gameState.scanner.x - size / 2,
    y: gameState.scanner.y - size / 2,
    width: size,
    height: size,
    action: handleScannerClick
  };
};

const makeLockdownZone = () => {
  const aiCore = gameState.map.rooms.find((room) => room.id === 'ai_core');
  if (!aiCore) return null;
  const center = { x: aiCore.x + aiCore.width / 2, y: aiCore.y + aiCore.height / 2 };
  const size = gameState.grid.cellSize * 1.2;
  return {
    id: 'lockdown',
    x: center.x - size / 2,
    y: center.y - size / 2,
    width: size,
    height: size,
    action: () => {
      if (!gameState.villain.isEscaped) return;
      resetVillainLockdown();
    }
  };
};

const makeBodyZone = () => {
  const size = gameState.grid.cellSize;
  return {
    id: 'body',
    x: gameState.body.x - size / 2,
    y: gameState.body.y - size / 2,
    width: size,
    height: size,
    action: () => {
      if (gameState.body.collectedSample) return;
      const distance = distanceBetween(gameState.player, gameState.body);
      if (distance > propRange) return;
      collectBodySample();
    }
  };
};

const handleScannerClick = () => {
  if (!hasMedicalSample()) return;
  removeMedicalSample();
  applyScannerResults();
  syncOxygenState();
  gameState.scanner.promptActive = false;
};

const hasKeycard = (lockId) => (
  lockId ? gameState.player.keycards.has(lockId) : true
);

const canAccessProp = (prop) => (!prop.requiresKey || hasKeycard(prop.lockId));

const makePropZone = (prop) => ({
  id: prop.id,
  x: prop.x - gameState.grid.cellSize / 2,
  y: prop.y - gameState.grid.cellSize / 2,
  width: gameState.grid.cellSize,
  height: gameState.grid.cellSize,
  action: () => {
    if (!canAccessProp(prop)) {
      prop.promptText = lockedPrompt;
      return;
    }
    if (prop.type === 'desk' && prop.roomId) markDeskDiscovered(prop.roomId);
    if (!prop.contents.length) {
      prop.isEmpty = true;
      prop.promptText = 'EMPTY';
      prop.searched = true;
      return;
    }
    prop.searched = true;
    prop.isEmpty = false;
    gameState.ui.openContainerId = prop.id;
  }
});

export const updateInteractions = () => {
  const zones = gameState.interactions.clickZones;
  zones.length = 0;
  gameState.scanner.promptActive = false;
  if (!gameState.case.identified && hasMedicalSample() && gameState.scanner.x != null) {
    const distance = distanceBetween(gameState.player, gameState.scanner);
    if (distance <= scannerRange) {
      gameState.scanner.promptActive = true;
      zones.push(makeScannerZone());
    }
  }
  const lockdownZone = makeLockdownZone();
  if (lockdownZone) {
    const center = { x: lockdownZone.x + lockdownZone.width / 2, y: lockdownZone.y + lockdownZone.height / 2 };
    const distance = distanceBetween(gameState.player, center);
    if (distance <= propRange) zones.push(lockdownZone);
  }
  if (!gameState.body.collectedSample && gameState.body.x != null) {
    const distance = distanceBetween(gameState.player, gameState.body);
    if (distance <= propRange) zones.push(makeBodyZone());
  }
  gameState.props.forEach((prop) => {
    prop.promptActive = false;
    prop.promptText = prop.isEmpty ? 'EMPTY' : 'CLICK TO SEARCH';
    const distance = distanceBetween(gameState.player, prop);
    if (distance > propRange) return;
    prop.promptActive = true;
    if (!canAccessProp(prop)) {
      prop.promptText = lockedPrompt;
      return;
    }
    zones.push(makePropZone(prop));
  });
};

const contains = (zone, x, y) => (
  x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height
);

export const tryHandleInteractionClick = (worldX, worldY) => {
  const zone = gameState.interactions.clickZones.find((candidate) => contains(candidate, worldX, worldY));
  if (!zone) return false;
  zone.action();
  return true;
};
