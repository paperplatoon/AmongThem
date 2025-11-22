import { gameState } from '../state/gameState.js';
import { distanceBetween } from '../utils/geometry.js';
import { syncOxygenState } from '../movement/oxygenSystem.js';
import { markVictimIdentified, markComputerDiscovered } from '../state/journalState.js';
import { collectBodySample } from '../body/bodyInteraction.js';
import { resetVillainLockdown } from '../villain/villainSystem.js';
import { cellToWorldCenter } from '../state/gridState.js';
import { closeVendingMenu } from '../ui/vendingMenu.js';
import { startHackingForProp, isPropComputerLocked } from '../hacking/hackingState.js';
import { closeOverlay, openOverlay, OverlayId } from '../state/overlayManager.js';

const scannerRange = 96;
const propRange = 88;
const lockedPrompt = 'LOCKED - KEYCARD REQUIRED';

const hasMedicalSample = () => Boolean(gameState.body.playerHasSample);

const removeMedicalSample = () => {
  gameState.body.playerHasSample = false;
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

const makeTestingStationZone = () => {
  const size = gameState.grid.cellSize;
  return {
    id: 'testing_station',
    x: gameState.testingStation.x - size / 2,
    y: gameState.testingStation.y - size / 2,
    width: size,
    height: size,
    action: () => {
      closeOpenMenus();
      openOverlay(OverlayId.WEAPON_TESTING);
    }
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

const makeAccuseZone = () => {
  const bridge = gameState.map.rooms.find((room) => room.id === 'bridge');
  if (!bridge) return null;
  const center = { x: bridge.x + bridge.width / 2, y: bridge.y + bridge.height / 2 };
  const size = gameState.grid.cellSize;
  return {
    id: 'accuse',
    x: center.x - size / 2,
    y: center.y - size / 2,
    width: size,
    height: size,
    action: () => {
      closeOpenMenus();
      gameState.accusation.active = true;
      gameState.accusation.result = 'selecting';
      gameState.ui.openAccusation = true;
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

const tryAutoUnlockLocker = (prop) => {
  if (!prop?.lockpickId) return false;
  if (!prop.lockId || hasKeycard(prop.lockId)) {
    prop.lockpickUnlocked = true;
    prop.promptText = 'CLICK TO SEARCH';
    return true;
  }
  return false;
};

const closeOpenMenus = () => {
  gameState.ui.openContainerId = null;
  gameState.ui.openVendingId = null;
  gameState.ui.openLockpickId = null;
  gameState.ui.openAccusation = false;
  gameState.accusation.active = false;
  gameState.accusation.result = 'idle';
  gameState.lockpick.activeId = null;
  gameState.lockpick.leftHeld = false;
  gameState.lockpick.rightHeld = false;
  closeVendingMenu();
  closeOverlay();
};

const startLockpickSession = (prop) => {
  if (!prop?.lockpickId) return;
  closeOpenMenus();
  gameState.lockpick.activeId = prop.lockpickId;
  gameState.lockpick.leftHeld = false;
  gameState.lockpick.rightHeld = false;
  gameState.ui.openLockpickId = prop.lockpickId;
};

const makePropZone = (prop) => ({
  id: prop.id,
  x: prop.x - gameState.grid.cellSize / 2,
  y: prop.y - gameState.grid.cellSize / 2,
  width: gameState.grid.cellSize,
  height: gameState.grid.cellSize,
  action: () => {
    if (prop.type === 'computer' && isPropComputerLocked(prop)) {
      closeOpenMenus();
      startHackingForProp(prop.id);
      return;
    }
    if (prop.lockpickId && !prop.lockpickUnlocked) {
      if (!tryAutoUnlockLocker(prop)) {
        startLockpickSession(prop);
        return;
      }
    }
    if (!canAccessProp(prop)) {
      prop.promptText = lockedPrompt;
      return;
    }
    if (prop.type === 'vending_machine') {
      closeVendingMenu();
      gameState.ui.openContainerId = null;
      gameState.ui.openVendingId = prop.id;
      gameState.ui.vendingMessage = null;
      openOverlay(OverlayId.VENDING);
      return;
    }
    if (prop.type === 'computer' && prop.roomId) markComputerDiscovered(prop.roomId);
    if (!prop.contents.length) {
      prop.isEmpty = true;
      prop.promptText = 'EMPTY';
      prop.searched = true;
      return;
    }
    prop.searched = true;
    prop.isEmpty = false;
    closeVendingMenu();
    gameState.ui.openContainerId = prop.id;
    openOverlay(OverlayId.CONTAINER);
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
  if (gameState.testingStation.x != null) {
    const distance = distanceBetween(gameState.player, gameState.testingStation);
    if (distance <= scannerRange) {
      zones.push(makeTestingStationZone());
    }
  }
  const lockdownZone = makeLockdownZone();
  if (lockdownZone) {
    const center = { x: lockdownZone.x + lockdownZone.width / 2, y: lockdownZone.y + lockdownZone.height / 2 };
    const distance = distanceBetween(gameState.player, center);
    if (distance <= propRange) zones.push(lockdownZone);
  }
  const accuseZone = makeAccuseZone();
  if (accuseZone) {
    const center = { x: accuseZone.x + accuseZone.width / 2, y: accuseZone.y + accuseZone.height / 2 };
    const distance = distanceBetween(gameState.player, center);
    if (distance <= propRange) zones.push(accuseZone);
  }
  if (!gameState.body.collectedSample && gameState.body.x != null) {
    const distance = distanceBetween(gameState.player, gameState.body);
    if (distance <= propRange) zones.push(makeBodyZone());
  }
  gameState.props.forEach((prop) => {
    prop.promptActive = false;
    if (prop.type === 'computer' && isPropComputerLocked(prop)) {
      prop.promptText = 'COMPUTER LOCKED - CLICK TO HACK';
    } else {
      prop.promptText = prop.isEmpty ? 'EMPTY' : 'CLICK TO SEARCH';
    }
    if (prop.lockpickId && !prop.lockpickUnlocked) {
      const hasKey = hasKeycard(prop.lockId);
      prop.promptText = hasKey ? 'CLICK TO USE KEYCARD' : 'CLICK TO PICK LOCK';
    }
    if (prop.type === 'vending_machine') prop.promptText = 'CLICK TO BUY';
    const distance = distanceBetween(gameState.player, prop);
    if (distance > propRange) return;
    prop.promptActive = true;
    if (prop.lockpickId && !prop.lockpickUnlocked) {
      if (!tryAutoUnlockLocker(prop)) {
        zones.push(makePropZone(prop));
        return;
      }
    }
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
  if (gameState.hacking.active) return false;
  const zone = gameState.interactions.clickZones.find((candidate) => contains(candidate, worldX, worldY));
  if (!zone) return false;
  zone.action();
  return true;
};
