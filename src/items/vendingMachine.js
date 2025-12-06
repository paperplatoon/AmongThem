import { gameState } from '../state/gameState.js';
import { createItemFromDefinition } from '../state/itemDefinitions.js';

export const spendMoneyOnVending = (itemType, cost) => {
  const player = gameState.player;
  if (!player) return { success: false, reason: 'no_player' };
  if (player.money < cost) return { success: false, reason: 'insufficient_funds' };
  const item = createItemFromDefinition(`vending_${itemType}`, itemType);
  if (!item) return { success: false, reason: 'no_item_definition' };
  if (gameState.inventory.length >= gameState.config.inventorySlots) {
    return { success: false, reason: 'inventory_full' };
  }
  player.money -= cost;
  gameState.inventory.push(item);
  return { success: true, item };
};
