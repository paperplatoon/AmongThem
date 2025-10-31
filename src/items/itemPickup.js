import { gameState } from '../state/gameState.js';
import { distanceBetween } from '../utils/geometry.js';

const getRange = () => gameState.config.itemPickupRange;

const isCollected = (item) => item.collected;

const distanceToPlayer = (item) => distanceBetween(item, gameState.player);

const findPickupCandidate = () => {
  let best = null;
  let bestDistance = Infinity;
  gameState.items.forEach((item) => {
    if (isCollected(item)) return;
    const distance = distanceToPlayer(item);
    if (distance > getRange() || distance >= bestDistance) return;
    best = item;
    bestDistance = distance;
  });
  return best;
};

const alreadyOwned = (id) => gameState.inventory.some((entry) => entry.id === id);

const addToInventory = (item) => {
  if (alreadyOwned(item.id)) return;
  gameState.inventory.push({ id: item.id, label: item.label });
};

const collectItem = (item) => {
  if (!item) return;
  item.collected = true;
  addToInventory(item);
  gameState.pressedKeys.delete('e');
};

export const handleItemPickup = () => {
  if (!gameState.pressedKeys.has('e')) return;
  collectItem(findPickupCandidate());
};
