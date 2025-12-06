import { gameState } from '../state/gameState.js';
import { UPGRADE_POOL } from './upgradeDefinitions.js';
import { worldPointToCell, cellToWorldCenter } from '../state/gridState.js';

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Initialize the upgrade terminal in AI Core.
 * Called during case generation.
 * Randomly selects 5 upgrades from the pool, with one on sale for 50% off.
 */
export const initializeUpgradeTerminal = () => {
  // Find AI Core room
  const aiCore = gameState.map.rooms.find((room) => room.id === 'ai_core');
  if (!aiCore) return;

  // Position at center of room
  const x = aiCore.x + aiCore.width / 2;
  const y = aiCore.y + aiCore.height / 2;
  const cell = worldPointToCell({ x, y });
  const worldPos = cellToWorldCenter(cell.x, cell.y);

  // Randomly select 5 upgrades from the pool
  const shuffled = shuffleArray(UPGRADE_POOL);
  const selectedUpgrades = shuffled.slice(0, 5);

  // Pick one upgrade to be on sale (50% off)
  const saleIndex = Math.floor(Math.random() * selectedUpgrades.length);
  const saleUpgradeId = selectedUpgrades[saleIndex].id;

  // Assign to game state
  Object.assign(gameState.upgradeTerminal, {
    cellX: cell.x,
    cellY: cell.y,
    x: worldPos.x,
    y: worldPos.y,
    promptActive: false,
    availableUpgrades: selectedUpgrades,
    saleUpgradeId
  });
};

/**
 * Calculate the cost of an upgrade (applying sale discount if applicable)
 */
export const getUpgradeCost = (upgrade) => {
  const isSale = upgrade.id === gameState.upgradeTerminal.saleUpgradeId;
  return isSale ? Math.floor(upgrade.baseCost / 2) : upgrade.baseCost;
};

/**
 * Purchase an upgrade from the terminal
 */
export const purchaseUpgrade = (upgradeId) => {
  const player = gameState.player;
  if (!player) return { success: false, reason: 'no_player' };

  // Find the upgrade in available upgrades
  const upgrade = gameState.upgradeTerminal.availableUpgrades.find(u => u.id === upgradeId);
  if (!upgrade) return { success: false, reason: 'upgrade_not_available' };

  // Check if already owned
  if (upgrade.ownershipCheck()) return { success: false, reason: 'already_owned' };

  // Check if player has enough money
  const cost = getUpgradeCost(upgrade);
  if (player.money < cost) return { success: false, reason: 'insufficient_funds' };

  // Apply the upgrade
  upgrade.applyUpgrade();

  // Deduct cost
  player.money -= cost;

  return { success: true, upgrade, cost };
};
