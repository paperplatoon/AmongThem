import { gameState } from '../state/gameState.js';
import { distanceBetween } from '../utils/geometry.js';
import { syncOxygenState } from '../movement/oxygenSystem.js';

const scannerRange = 96;

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

const handleScannerClick = () => {
  if (!hasMedicalSample()) return;
  removeMedicalSample();
  applyScannerResults();
  syncOxygenState();
  gameState.scanner.promptActive = false;
};

export const updateInteractions = () => {
  const zones = gameState.interactions.clickZones;
  zones.length = 0;
  gameState.scanner.promptActive = false;
  if (gameState.case.identified) return;
  if (!hasMedicalSample()) return;
  if (gameState.scanner.x == null) return;
  const distance = distanceBetween(gameState.player, gameState.scanner);
  if (distance > scannerRange) return;
  gameState.scanner.promptActive = true;
  zones.push(makeScannerZone());
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
