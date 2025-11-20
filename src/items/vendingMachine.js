import { gameState } from '../state/gameState.js';
import { createItemFromDefinition } from '../state/itemDefinitions.js';

const purchaseTaser = () => {
  const taser = gameState.player.taser;
  if (!taser || taser.hasTaser) return { success: false, reason: 'already_owned' };
  taser.hasTaser = true;
  taser.cooldownRemaining = 0;
  return { success: true, item: { id: 'taser_upgrade', label: 'Taser', type: 'taser' } };
};

const purchaseKeycardLocator = () => {
  const upgrades = gameState.player.upgrades;
  if (!upgrades) return { success: false, reason: 'no_player' };
  if (upgrades.keycardLocator) return { success: false, reason: 'already_owned' };
  upgrades.keycardLocator = true;
  return { success: true, item: { id: 'keycard_locator_upgrade', label: 'Keycard Locator', type: 'upgrade' } };
};

const purchaseFasterHack = () => {
  const upgrades = gameState.player.upgrades;
  if (!upgrades) return { success: false, reason: 'no_player' };
  if (upgrades.hasFasterHack) return { success: false, reason: 'already_owned' };
  upgrades.hasFasterHack = true;
  upgrades.hackSpeedMultiplier *= 2;
  return { success: true, item: { id: 'faster_hack_upgrade', label: 'Faster Hack', type: 'upgrade' } };
};

export const spendMoneyOnVending = (itemType, cost) => {
  const player = gameState.player;
  if (!player) return { success: false, reason: 'no_player' };
  if (player.money < cost) return { success: false, reason: 'insufficient_funds' };
  if (itemType === 'taser') {
    const result = purchaseTaser();
    if (!result.success) return result;
    player.money -= cost;
    return result;
  }
  if (itemType === 'keycard_locator') {
    const result = purchaseKeycardLocator();
    if (!result.success) return result;
    player.money -= cost;
    return result;
  }
  if (itemType === 'faster_hack') {
    const result = purchaseFasterHack();
    if (!result.success) return result;
    player.money -= cost;
    return result;
  }
  const item = createItemFromDefinition(`vending_${itemType}`, itemType);
  if (!item) return { success: false, reason: 'no_item_definition' };
  player.money -= cost;
  gameState.inventory.push(item);
  return { success: true, item };
};
