import { gameState } from '../state/gameState.js';
import { distanceBetween } from '../utils/geometry.js';

const pickupRange = () => gameState.config.itemPickupRange;

const hasKeycard = (lockerId) => gameState.player.keycards.has(lockerId);

const distanceToPlayer = (keycard) => distanceBetween(gameState.player, keycard);

const findCandidate = () => {
  let best = null;
  let bestDistance = Infinity;
  gameState.keycards.forEach((keycard) => {
    if (keycard.collected) return;
    if (hasKeycard(keycard.lockerId)) return;
    const distance = distanceToPlayer(keycard);
    if (distance > pickupRange() || distance >= bestDistance) return;
    best = keycard;
    bestDistance = distance;
  });
  return best;
};

const collectKeycard = (keycard) => {
  keycard.collected = true;
  gameState.player.keycards.add(keycard.lockerId);
  gameState.pressedKeys.delete('e');
};

export const handleKeycardPickup = () => {
  if (!gameState.pressedKeys.has('e')) return;
  const candidate = findCandidate();
  if (!candidate) return;
  collectKeycard(candidate);
};
