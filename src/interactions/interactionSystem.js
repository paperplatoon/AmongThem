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
import { addParticleBurst } from '../state/visualEffects.js';
import { calculateTimeWindow8h, calculateTimeWindow4h } from '../state/timeWindowState.js';

const scannerRange = 96;
const propRange = 88;
const lockedPrompt = 'LOCKED - KEYCARD REQUIRED';

const hasSampleInInventory = (type) => {
  return gameState.inventory.some(item => item.type === type);
};

const removeSampleFromInventory = (type) => {
  const index = gameState.inventory.findIndex(item => item.type === type);
  if (index !== -1) {
    gameState.inventory.splice(index, 1);
  }
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

const makeBioDataTerminalZone = () => {
  const size = gameState.grid.cellSize;
  return {
    id: 'bio_data_terminal',
    x: gameState.bioDataTerminal.x - size / 2,
    y: gameState.bioDataTerminal.y - size / 2,
    width: size,
    height: size,
    action: () => {
      closeOpenMenus();
      openOverlay(OverlayId.BIO_DATA);
    }
  };
};

const makeDoorTerminalZone = (terminal) => {
  const size = gameState.grid.cellSize * 0.6;
  return {
    id: terminal.id,
    x: terminal.x - size / 2,
    y: terminal.y - size / 2,
    width: size,
    height: size,
    action: () => {
      closeOpenMenus();
      gameState.ui.doorTerminal.activeRoomId = terminal.roomId;
      openOverlay(OverlayId.DOOR_TERMINAL);
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
      const screenX = center.x - gameState.camera.x;
      const screenY = center.y - gameState.camera.y;
      addParticleBurst(screenX, screenY, '#ff6b6b', 12);
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
  const hasBodySample = hasSampleInInventory('evidence_body');
  const hasBloodSample = hasSampleInInventory('evidence_blood');

  if (!hasBodySample && !hasBloodSample) return;

  // Visual feedback at scanner
  const screenX = gameState.scanner.x - gameState.camera.x;
  const screenY = gameState.scanner.y - gameState.camera.y;
  addParticleBurst(screenX, screenY, '#66bfff', 12);
  addFloatingText(screenX, screenY, 'Scanned', '#66bfff');

  // Scan body sample (reveals 8h window + method category)
  if (hasBodySample) {
    removeSampleFromInventory('evidence_body');

    // Calculate 8h window
    const timeOfDeath = gameState.case.timeOfDeath;
    if (timeOfDeath) {
      gameState.case.timeOfDeathWindow8h = calculateTimeWindow8h(timeOfDeath);
    }

    // Mark that autopsy was performed (for journal display)
    gameState.case.autopsyPerformed = true;

    syncOxygenState();
  }
  // Scan blood sample (narrows to 4h window)
  else if (hasBloodSample) {
    // Require 8h window first
    if (!gameState.case.timeOfDeathWindow8h) return;

    removeSampleFromInventory('evidence_blood');

    // Calculate 4h window
    const timeOfDeath = gameState.case.timeOfDeath;
    if (timeOfDeath) {
      gameState.case.timeOfDeathWindow4h = calculateTimeWindow4h(timeOfDeath);
    }
  }

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
  gameState.ui.doorTerminal.activeRoomId = null;
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
  gameState.bioDataTerminal.promptActive = false;

  // Show scanner prompt if player has either body sample or blood sample in inventory
  const canUseScanner = hasSampleInInventory('evidence_body') ||
                        (hasSampleInInventory('evidence_blood') && gameState.case.timeOfDeathWindow8h);

  if (canUseScanner && gameState.scanner.x != null) {
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
  if (gameState.bioDataTerminal.x != null) {
    const distance = distanceBetween(gameState.player, gameState.bioDataTerminal);
    if (distance <= scannerRange) {
      gameState.bioDataTerminal.promptActive = true;
      zones.push(makeBioDataTerminalZone());
    }
  }
  gameState.doorTerminals.forEach((terminal) => {
    terminal.promptActive = false;
    if (terminal.x != null) {
      const distance = distanceBetween(gameState.player, terminal);
      if (distance <= scannerRange) {
        terminal.promptActive = true;
        zones.push(makeDoorTerminalZone(terminal));
      }
    }
  });
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
