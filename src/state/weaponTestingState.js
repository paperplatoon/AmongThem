import { gameState } from './gameState.js';
import { worldPointToCell, cellToWorldCenter } from './gridState.js';

export const initializeTestingStation = () => {
  const medbay = gameState.map.rooms.find((room) => room.id === 'medbay');
  if (!medbay) return;

  // Position at center of top wall (back wall)
  const x = medbay.x + medbay.width / 2;
  const y = medbay.y + 20;
  const cell = worldPointToCell({ x, y });
  const worldPos = cellToWorldCenter(cell.x, cell.y);

  Object.assign(gameState.testingStation, {
    cellX: cell.x,
    cellY: cell.y,
    x: worldPos.x,
    y: worldPos.y
  });
};

export const initializeBioDataTerminal = () => {
  const engineering = gameState.map.rooms.find((room) => room.id === 'engineering');
  if (!engineering) return;

  // Position at center of top wall (back wall)
  const x = engineering.x + engineering.width / 2;
  const y = engineering.y + 20;
  const cell = worldPointToCell({ x, y });
  const worldPos = cellToWorldCenter(cell.x, cell.y);

  Object.assign(gameState.bioDataTerminal, {
    cellX: cell.x,
    cellY: cell.y,
    x: worldPos.x,
    y: worldPos.y
  });
};

const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const generateWeaponTestResults = () => {
  const results = {};
  const killerRoleId = gameState.case.killer?.roleKey;

  if (!killerRoleId) return results;

  gameState.journal.entries.forEach((entry) => {
    const roleId = entry.id;

    if (roleId === killerRoleId) {
      // Killer's weapon always returns inconclusive
      results[roleId] = 'inconclusive';
    } else {
      // Non-killer: 90% clean, 10% inconclusive
      const hash = simpleHash(roleId + killerRoleId);
      const roll = hash % 100;
      results[roleId] = roll < 90 ? 'clean' : 'inconclusive';
    }
  });

  return results;
};
