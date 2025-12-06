import { gameState } from '../state/gameState.js';
import { worldPointToCell } from '../state/gridState.js';
import { addFloatingText, addParticleBurst } from '../state/visualEffects.js';

const getCountdownDuration = () => {
  const baseTime = 5; // seconds
  const multiplier = gameState.player.upgrades?.bloodScannerSpeedMultiplier || 1;
  return baseTime / multiplier; // Higher multiplier = less time
};

const getDetectionRange = () => {
  const baseRange = 20; // grid cells
  const multiplier = gameState.player.upgrades?.bloodDetectorRangeMultiplier || 1;
  return baseRange * multiplier; // Higher multiplier = more range
};

const getManhattanDistance = (x1, y1, x2, y2) => {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
};

const getPlayerCell = () => {
  return worldPointToCell({ x: gameState.player.x, y: gameState.player.y });
};

export const isAdjacentToMurderSite = () => {
  const playerCell = getPlayerCell();
  const murderCellX = gameState.case.murderCellX;
  const murderCellY = gameState.case.murderCellY;

  if (murderCellX == null || murderCellY == null) return false;

  const distance = getManhattanDistance(
    playerCell.x,
    playerCell.y,
    murderCellX,
    murderCellY
  );

  return distance <= 2;
};

const calculateBloodDistance = () => {
  const playerCell = getPlayerCell();
  const murderCellX = gameState.case.murderCellX;
  const murderCellY = gameState.case.murderCellY;

  if (murderCellX == null || murderCellY == null) {
    return 'none';
  }

  const distance = getManhattanDistance(
    playerCell.x,
    playerCell.y,
    murderCellX,
    murderCellY
  );

  if (distance <= getDetectionRange()) {
    return distance;
  }

  return 'none';
};

const collectBloodSample = () => {
  if (gameState.case.bloodSampleCollected) return;

  // Add blood sample to inventory
  const bloodSample = {
    id: 'blood_sample',
    type: 'evidence_blood',
    label: 'Blood Sample for Medbay Scanner',
    persistent: false
  };
  gameState.inventory.push(bloodSample);

  // Mark as collected
  gameState.case.bloodSampleCollected = true;

  // Visual effects at player position
  const playerX = gameState.player.x - gameState.camera.x;
  const playerY = gameState.player.y - gameState.camera.y;
  addParticleBurst(playerX, playerY, '#ff0000', 12);
  addFloatingText(playerX, playerY, 'Blood Sample acquired', '#ff0000');
};

export const activateBloodDetector = () => {
  const detector = gameState.bloodDetector;
  if (detector.active) return; // Already active

  detector.active = true;
  detector.countdownRemaining = getCountdownDuration();
  detector.lastReading = null;
  detector.hasBeenUsed = true;
};

export const updateBloodDetector = (deltaSeconds) => {
  const detector = gameState.bloodDetector;
  if (!detector.active) return;

  detector.countdownRemaining -= deltaSeconds;

  if (detector.countdownRemaining <= 0) {
    // Countdown finished, take reading
    detector.countdownRemaining = 0;
    detector.active = false;

    // Calculate distance
    const distance = calculateBloodDistance();
    detector.lastReading = distance;

    // Check if adjacent and collect sample
    if (isAdjacentToMurderSite() && !gameState.case.bloodSampleCollected) {
      collectBloodSample();
    }
  }
};
