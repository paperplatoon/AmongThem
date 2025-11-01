import { gameState } from '../state/gameState.js';
import { add, scale } from '../utils/geometry.js';
import { isPointWalkable } from '../collision/collisionMask.js';
import { worldPointToCell } from '../state/gridState.js';
import { updateStamina, getCurrentSpeed } from './staminaSystem.js';

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

const tryMove = (player, delta) => {
  attemptMove(player, { x: delta.x, y: 0 });
  attemptMove(player, { x: 0, y: delta.y });
};

export const updateMovement = (deltaSeconds) => {
  updateStamina(deltaSeconds);
  const direction = normalize(getDirection(gameState.pressedKeys));
  const speed = getCurrentSpeed();
  const velocity = scale(direction, speed * deltaSeconds);
  tryMove(gameState.player, velocity);
};
