import { gameState } from '../state/gameState.js';
import { add, scale } from '../utils/geometry.js';
import { isPointWalkable } from '../collision/collisionMask.js';

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

const getSpeed = (set, player) => (set.has('Shift') ? player.sprintSpeed : player.walkSpeed);

const isWalkablePoint = (point) => isPointWalkable(point);

const attemptMove = (player, delta) => {
  if (!delta.x && !delta.y) return;
  const next = add({ x: player.x, y: player.y }, delta);
  if (!isWalkablePoint(next)) return;
  player.x = next.x;
  player.y = next.y;
};

const tryMove = (player, delta) => {
  attemptMove(player, { x: delta.x, y: 0 });
  attemptMove(player, { x: 0, y: delta.y });
};

export const updateMovement = (deltaSeconds) => {
  const direction = normalize(getDirection(gameState.pressedKeys));
  const speed = getSpeed(gameState.pressedKeys, gameState.player);
  const velocity = scale(direction, speed * deltaSeconds);
  tryMove(gameState.player, velocity);
};
