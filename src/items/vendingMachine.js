import { gameState } from '../state/gameState.js';
import { createItemFromDefinition } from '../state/itemDefinitions.js';

const purchaseTaser = () => {
  const taser = gameState.player.taser;
  if (!taser || taser.hasTaser) return { success: false, reason: 'already_owned' };
  taser.hasTaser = true;
  taser.cooldownRemaining = 0;
  return { success: true, item: { id: 'taser_upgrade', label: 'Taser', type: 'taser' } };
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
  const item = createItemFromDefinition(`vending_${itemType}`, itemType);
  if (!item) return { success: false, reason: 'no_item_definition' };
  player.money -= cost;
  gameState.inventory.push(item);
  return { success: true, item };
};
