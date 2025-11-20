import { gameState } from '../state/gameState.js';
import { add, scale } from '../utils/geometry.js';
import { isPointWalkable } from '../collision/collisionMask.js';
import { worldPointToCell, toIndex } from '../state/gridState.js';
import { updateStamina, getCurrentSpeed } from './staminaSystem.js';
import { updateOxygen } from './oxygenSystem.js';
import { updateTaser } from '../combat/taserSystem.js';

const boolToNumber = (value) => (value ? 1 : 0);

const hasKey = (set, keys) => keys.some((key) => set.has(key));

const axisFromKeys = (set, positive, negative) => (
  boolToNumber(hasKey(set, positive)) - boolToNumber(hasKey(set, negative))
);

const normalize = (vector) => {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (!magnitude) return vector;
  return { x: vector.x / magnitude, y: vector.y / magnitude };
};

const getDirection = (set) => ({
  x: axisFromKeys(set, ['d', 'ArrowRight'], ['a', 'ArrowLeft']),
  y: axisFromKeys(set, ['s', 'ArrowDown'], ['w', 'ArrowUp'])
});

const isWalkablePoint = (point) => isPointWalkable(point);

const attemptMove = (player, delta) => {
  if (!delta.x && !delta.y) return;
  const next = add({ x: player.x, y: player.y }, delta);
  if (!isWalkablePoint(next)) return;
  player.x = next.x;
  player.y = next.y;
  const cell = worldPointToCell(player);
  player.cellX = cell.x;
  player.cellY = cell.y;
};

const getCellTraits = (cell) => {
  const mask = gameState.map.cellTraits;
  if (!mask) return 0;
  if (cell.x < 0 || cell.y < 0 || cell.x >= gameState.grid.width || cell.y >= gameState.grid.height) return 0;
  return mask[toIndex(cell.x, cell.y)];
};

const tryMove = (player, delta) => {
  attemptMove(player, { x: delta.x, y: 0 });
  attemptMove(player, { x: 0, y: delta.y });
};

export const updateMovement = (deltaSeconds) => {
  if (gameState.ui.showGameOver) return;
  updateStamina(deltaSeconds);
  updateOxygen(deltaSeconds);
  updateTaser(deltaSeconds);
  const currentCell = worldPointToCell({ x: gameState.player.x, y: gameState.player.y });
  gameState.player.cellX = currentCell.x;
  gameState.player.cellY = currentCell.y;
  if (gameState.hacking.active) return;
  const direction = normalize(getDirection(gameState.pressedKeys));
  const baseSpeed = getCurrentSpeed();
  const traits = getCellTraits(currentCell);
  let modifier = 1;
  if (traits & gameState.map.cellTraitFlags.VENT) modifier *= gameState.config.ventSpeedModifier;
  const effectiveSpeed = baseSpeed * modifier;
  const velocity = scale(direction, effectiveSpeed * deltaSeconds);
  tryMove(gameState.player, velocity);
  if (direction.x || direction.y) {
    gameState.player.lastMoveDirection = direction;
  }
};
